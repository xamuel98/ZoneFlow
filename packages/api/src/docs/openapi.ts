// OpenAPI configuration
export const openAPIConfig = {
  openapi: '3.0.0',
  info: {
    title: 'ZoneFlow API',
    version: '1.0.0',
    description: 'Comprehensive delivery management system API with real-time tracking, driver management, and order processing.',
    contact: {
      name: 'ZoneFlow Support',
      email: 'support@zoneflow.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.zoneflow.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp'
          }
        },
        required: ['error']
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email'
          },
          name: {
            type: 'string',
            description: 'User full name'
          },
          role: {
            type: 'string',
            enum: ['admin', 'manager', 'dispatcher'],
            description: 'User role'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          }
        },
        required: ['id', 'email', 'name', 'role']
      },
      Driver: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Driver ID'
          },
          name: {
            type: 'string',
            description: 'Driver full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Driver email'
          },
          phone: {
            type: 'string',
            description: 'Driver phone number'
          },
          licenseNumber: {
            type: 'string',
            description: 'Driver license number'
          },
          vehicleType: {
            type: 'string',
            enum: ['car', 'motorcycle', 'bicycle', 'truck', 'van'],
            description: 'Vehicle type'
          },
          vehiclePlate: {
            type: 'string',
            description: 'Vehicle license plate'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended'],
            description: 'Driver status'
          },
          isOnline: {
            type: 'boolean',
            description: 'Driver online status'
          },
          currentLocation: {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'name', 'email', 'phone', 'licenseNumber', 'vehicleType', 'status']
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Order ID'
          },
          customerName: {
            type: 'string',
            description: 'Customer name'
          },
          customerPhone: {
            type: 'string',
            description: 'Customer phone'
          },
          customerEmail: {
            type: 'string',
            format: 'email',
            description: 'Customer email'
          },
          pickupAddress: {
            type: 'string',
            description: 'Pickup address'
          },
          deliveryAddress: {
            type: 'string',
            description: 'Delivery address'
          },
          pickupLocation: {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            },
            required: ['latitude', 'longitude']
          },
          deliveryLocation: {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            },
            required: ['latitude', 'longitude']
          },
          status: {
            type: 'string',
            enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
            description: 'Order status'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Order priority'
          },
          driverId: {
            type: 'string',
            description: 'Assigned driver ID'
          },
          estimatedDeliveryTime: {
            type: 'string',
            format: 'date-time',
            description: 'Estimated delivery time'
          },
          actualDeliveryTime: {
            type: 'string',
            format: 'date-time',
            description: 'Actual delivery time'
          },
          notes: {
            type: 'string',
            description: 'Order notes'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'customerName', 'customerPhone', 'pickupAddress', 'deliveryAddress', 'pickupLocation', 'deliveryLocation', 'status']
      },
      Geofence: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Geofence ID'
          },
          name: {
            type: 'string',
            description: 'Geofence name'
          },
          type: {
            type: 'string',
            enum: ['delivery_zone', 'restricted_area', 'depot', 'customer_zone'],
            description: 'Geofence type'
          },
          coordinates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              },
              required: ['latitude', 'longitude']
            },
            description: 'Geofence boundary coordinates'
          },
          radius: {
            type: 'number',
            description: 'Radius in meters (for circular geofences)'
          },
          isActive: {
            type: 'boolean',
            description: 'Geofence active status'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'name', 'type', 'coordinates', 'isActive']
      },
      Location: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Location record ID'
          },
          driverId: {
            type: 'string',
            description: 'Driver ID'
          },
          latitude: {
            type: 'number',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate'
          },
          accuracy: {
            type: 'number',
            description: 'Location accuracy in meters'
          },
          speed: {
            type: 'number',
            description: 'Speed in km/h'
          },
          heading: {
            type: 'number',
            description: 'Heading in degrees'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Location timestamp'
          }
        },
        required: ['id', 'driverId', 'latitude', 'longitude', 'timestamp']
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalDrivers: { type: 'number' },
          activeDrivers: { type: 'number' },
          totalOrders: { type: 'number' },
          pendingOrders: { type: 'number' },
          completedOrders: { type: 'number' },
          totalRevenue: { type: 'number' },
          averageDeliveryTime: { type: 'number' },
          onTimeDeliveryRate: { type: 'number' }
        }
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Health status'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          uptime: {
            type: 'number',
            description: 'Uptime in seconds'
          },
          memory: {
            type: 'object',
            properties: {
              rss: { type: 'number' },
              heapTotal: { type: 'number' },
              heapUsed: { type: 'number' },
              external: { type: 'number' }
            }
          },
          redis: {
            type: 'string',
            enum: ['connected', 'disconnected']
          },
          version: { type: 'string' },
          environment: { type: 'string' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Drivers',
      description: 'Driver management operations'
    },
    {
      name: 'Orders',
      description: 'Order management and tracking'
    },
    {
      name: 'Geofences',
      description: 'Geofence management'
    },
    {
      name: 'Location',
      description: 'Location tracking and updates'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard statistics and analytics'
    },
    {
      name: 'Monitoring',
      description: 'System monitoring and health checks'
    }
  ]
};

// Common response schemas
export const commonResponses = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  }
}