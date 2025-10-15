import { Context, Next } from 'hono';

export interface VersionedContext extends Context {
  version: string;
}

export const versioningMiddleware = () => {
  return async (c: Context, next: Next) => {
    // Extract version from URL path (e.g., /api/v1/drivers)
    const pathVersion = c.req.path.match(/\/api\/v(\d+)\//)?.[1];
    
    // Extract version from Accept header (e.g., application/vnd.zoneflow.v1+json)
    const acceptHeader = c.req.header('Accept');
    const headerVersion = acceptHeader?.match(/vnd\.zoneflow\.v(\d+)/)?.[1];
    
    // Extract version from custom header
    const customVersion = c.req.header('API-Version');
    
    // Determine version priority: custom header > path > accept header > default
    let version = customVersion || pathVersion || headerVersion || '1';
    
    // Validate version
    const supportedVersions = ['1', '2'];
    if (!supportedVersions.includes(version)) {
      return c.json({
        error: 'Unsupported API version',
        supportedVersions,
        requestedVersion: version
      }, 400);
    }
    
    // Add version to context
    (c as VersionedContext).version = version;
    
    // Add version info to response headers
    c.header('API-Version', version);
    c.header('Supported-Versions', supportedVersions.join(', '));
    
    await next();
  };
};

export const requireVersion = (requiredVersion: string) => {
  return async (c: Context, next: Next) => {
    const version = (c as VersionedContext).version;
    
    if (version !== requiredVersion) {
      return c.json({
        error: `This endpoint requires API version ${requiredVersion}`,
        currentVersion: version,
        requiredVersion
      }, 400);
    }
    
    await next();
  };
};

export const deprecatedVersion = (deprecatedVersion: string, sunsetDate?: string) => {
  return async (c: Context, next: Next) => {
    const version = (c as VersionedContext).version;
    
    if (version === deprecatedVersion) {
      c.header('Deprecation', 'true');
      if (sunsetDate) {
        c.header('Sunset', sunsetDate);
      }
      c.header('Warning', `299 - "API version ${deprecatedVersion} is deprecated"`);
    }
    
    await next();
  };
};

// Version-specific response transformers
export const transformResponseForVersion = (data: any, version: string) => {
  switch (version) {
    case '1':
      return transformV1Response(data);
    case '2':
      return transformV2Response(data);
    default:
      return data;
  }
};

const transformV1Response = (data: any) => {
  // V1 specific transformations
  if (Array.isArray(data)) {
    return {
      data,
      count: data.length,
      version: '1.0'
    };
  }
  
  return {
    ...data,
    version: '1.0'
  };
};

const transformV2Response = (data: any) => {
  // V2 specific transformations with enhanced metadata
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        count: data.length,
        version: '2.0',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return {
    data,
    meta: {
      version: '2.0',
      timestamp: new Date().toISOString()
    }
  };
};