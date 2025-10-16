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
            enum: ['available', 'unavailable']
          },
          websocket: {
            type: 'string',
            enum: ['available', 'unavailable']
          },
          queue: {
            type: 'string',
            enum: ['available', 'unavailable']
          }
        }
      },
      CreateDriverData: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            description: 'Driver full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Driver email address',
            example: 'john.doe@example.com'
          },
          phone: {
            type: 'string',
            minLength: 10,
            description: 'Driver phone number',
            example: '+1234567890'
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Driver password (optional, will be auto-generated if not provided)',
            example: 'securePassword123'
          },
          vehicleType: {
            type: 'string',
            description: 'Type of vehicle',
            example: 'car'
          },
          licensePlate: {
            type: 'string',
            description: 'Vehicle license plate number',
            example: 'ABC-123'
          },
          isAvailable: {
            type: 'boolean',
            default: true,
            description: 'Driver availability status'
          }
        },
        required: ['name', 'email', 'phone']
      },
      UpdateDriverData: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            description: 'Driver full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Driver email address',
            example: 'john.doe@example.com'
          },
          phone: {
            type: 'string',
            minLength: 10,
            description: 'Driver phone number',
            example: '+1234567890'
          },
          vehicleType: {
            type: 'string',
            description: 'Type of vehicle',
            example: 'car'
          },
          licensePlate: {
            type: 'string',
            description: 'Vehicle license plate number',
            example: 'ABC-123'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Driver availability status'
          }
        },
        description: 'All fields are optional for partial updates'
      },
      BulkCreateDriverData: {
        type: 'object',
        properties: {
          drivers: {
            type: 'array',
            items: { $ref: '#/components/schemas/CreateDriverData' },
            minItems: 1,
            description: 'Array of driver data objects to create'
          }
        },
        required: ['drivers']
      },
      BulkOperationResult: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              success: {
                type: 'integer',
                description: 'Number of successfully created drivers',
                example: 8
              },
              failed: {
                type: 'integer',
                description: 'Number of failed driver creations',
                example: 2
              },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    row: {
                      type: 'integer',
                      description: 'Row number that failed'
                    },
                    data: {
                      type: 'object',
                      description: 'The driver data that failed'
                    },
                    error: {
                      type: 'string',
                      description: 'Error message'
                    }
                  }
                },
                description: 'Array of errors for failed operations'
              },
              successfulDrivers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                },
                description: 'Array of successfully created drivers'
              }
            }
          }
        }
      },
      DriverStats: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of drivers',
            example: 25
          },
          active: {
            type: 'integer',
            description: 'Number of active drivers',
            example: 20
          },
          available: {
            type: 'integer',
            description: 'Number of available drivers',
            example: 15
          },
          busy: {
            type: 'integer',
            description: 'Number of busy drivers',
            example: 5
          }
        },
        required: ['total', 'active', 'available', 'busy']
      },
      DriverInvitation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Invitation ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Invited driver email'
          },
          name: {
            type: 'string',
            description: 'Invited driver name'
          },
          phone: {
            type: 'string',
            description: 'Invited driver phone number',
            nullable: true
          },
          vehicleType: {
            type: 'string',
            description: 'Vehicle type',
            nullable: true
          },
          licensePlate: {
            type: 'string',
            description: 'License plate number',
            nullable: true
          },
          message: {
            type: 'string',
            description: 'Custom invitation message',
            nullable: true
          },
          status: {
            type: 'string',
            enum: ['pending', 'accepted', 'expired', 'cancelled'],
            description: 'Invitation status'
          },
          token: {
            type: 'string',
            description: 'Invitation token'
          },
          invitedBy: {
            type: 'string',
            description: 'ID of user who sent the invitation'
          },
          invitedByName: {
            type: 'string',
            description: 'Name of user who sent the invitation'
          },
          businessId: {
            type: 'string',
            description: 'Business ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Invitation creation timestamp'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Invitation expiration timestamp'
          },
          acceptedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Invitation acceptance timestamp',
            nullable: true
          }
        },
        required: ['id', 'email', 'name', 'status', 'token', 'invitedBy', 'businessId', 'createdAt', 'expiresAt']
      },
      InvitationStats: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of invitations',
            example: 50
          },
          pending: {
            type: 'integer',
            description: 'Number of pending invitations',
            example: 15
          },
          accepted: {
            type: 'integer',
            description: 'Number of accepted invitations',
            example: 30
          },
          expired: {
            type: 'integer',
            description: 'Number of expired invitations',
            example: 3
          },
          cancelled: {
            type: 'integer',
            description: 'Number of cancelled invitations',
            example: 2
          }
        },
        required: ['total', 'pending', 'accepted', 'expired', 'cancelled']
      },
      CreateInvitationData: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address to send invitation to',
            example: 'driver@example.com'
          },
          name: {
            type: 'string',
            description: 'Driver name',
            example: 'John Doe'
          },
          phone: {
            type: 'string',
            description: 'Driver phone number',
            example: '+1234567890'
          },
          vehicleType: {
            type: 'string',
            description: 'Vehicle type',
            example: 'car'
          },
          licensePlate: {
            type: 'string',
            description: 'License plate number',
            example: 'ABC123'
          },
          expiresInDays: {
            type: 'integer',
            minimum: 1,
            maximum: 365,
            description: 'Number of days until invitation expires',
            example: 7,
            default: 7
          },
          message: {
            type: 'string',
            description: 'Custom invitation message',
            example: 'Welcome to our delivery team! We look forward to working with you.'
          }
        },
        required: ['email', 'name']
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check the health status of the API and its dependencies',
        responses: {
          200: {
            description: 'Health status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthCheck' }
              }
            }
          }
        }
      }
    },

    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                  name: { type: 'string', example: 'John Doe' },
                  role: { type: 'string', enum: ['admin', 'manager', 'dispatcher'], example: 'manager' }
                },
                required: ['email', 'password', 'name', 'role']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
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
      }
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user and return JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    }
                  }
                }
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
          400: {
            description: 'Bad Request',
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
      }
    },

    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Get the currently authenticated user information',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/drivers': {
      get: {
        tags: ['Drivers'],
        summary: 'Get all drivers',
        description: 'Retrieve all drivers for the business with pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by driver status',
            schema: { type: 'string', enum: ['active', 'inactive', 'suspended'] }
          }
        ],
        responses: {
          200: {
            description: 'List of drivers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Driver' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Drivers'],
        summary: 'Create a new driver',
        description: 'Create a single driver (requires admin or business_owner role)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDriverData' }
            }
          }
        },
        responses: {
          201: {
            description: 'Driver created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        driver: { $ref: '#/components/schemas/Driver' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid input data',
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
            description: 'Forbidden - Admin or business_owner role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          409: {
            description: 'Conflict - Email or phone already exists',
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
      }
    },

    '/api/v1/drivers/{id}': {
      get: {
        tags: ['Drivers'],
        summary: 'Get driver by ID',
        description: 'Retrieve a specific driver by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Driver ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Driver details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Driver' }
                  }
                }
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
      },
      put: {
        tags: ['Drivers'],
        summary: 'Update driver',
        description: 'Update an existing driver (requires admin or business_owner role)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Driver ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDriverData' }
            }
          }
        },
        responses: {
          200: {
            description: 'Driver updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        driver: { $ref: '#/components/schemas/Driver' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid input data',
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
            description: 'Forbidden - Admin or business_owner role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          404: {
            description: 'Driver not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          409: {
            description: 'Conflict - Email or phone already exists',
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
      },
      delete: {
        tags: ['Drivers'],
        summary: 'Delete driver',
        description: 'Delete an existing driver (requires admin or business_owner role)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Driver ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Driver deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Driver deleted successfully' }
                      }
                    }
                  }
                }
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
            description: 'Forbidden - Admin or business_owner role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          404: {
            description: 'Driver not found',
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
      }
    },

    '/api/v1/drivers/bulk': {
      post: {
        tags: ['Drivers'],
        summary: 'Create multiple drivers in bulk',
        description: 'Create multiple drivers at once (requires admin or business_owner role)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BulkCreateDriverData' }
            }
          }
        },
        responses: {
          201: {
            description: 'All drivers created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkOperationResult' }
              }
            }
          },
          200: {
            description: 'Partial success - some drivers created, some failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkOperationResult' }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid input data or all drivers failed',
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
            description: 'Forbidden - Admin or business_owner role required',
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
      }
    },

    '/api/v1/drivers/import': {
      post: {
        tags: ['Drivers'],
        summary: 'Import drivers from Excel/CSV file',
        description: 'Import drivers from uploaded Excel or CSV file (requires admin or business_owner role)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Excel (.xlsx, .xls) or CSV file containing driver data'
                  }
                },
                required: ['file']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'All drivers imported successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Successfully imported 10 drivers' },
                        success: { type: 'integer', description: 'Number of successfully imported drivers' },
                        failed: { type: 'integer', description: 'Number of failed imports' },
                        errors: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              row: { type: 'integer' },
                              data: { type: 'object' },
                              error: { type: 'string' }
                            }
                          }
                        },
                        successfulDrivers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              email: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          200: {
            description: 'Partial success - some drivers imported, some failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Imported 8 drivers with 2 failures' },
                        success: { type: 'integer' },
                        failed: { type: 'integer' },
                        errors: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              row: { type: 'integer' },
                              data: { type: 'object' },
                              error: { type: 'string' }
                            }
                          }
                        },
                        successfulDrivers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              email: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - No file uploaded, invalid file type, or all drivers failed to import',
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
            description: 'Forbidden - Admin or business_owner role required',
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
      }
    },

    '/api/v1/drivers/stats': {
      get: {
        tags: ['Drivers'],
        summary: 'Get driver statistics',
        description: 'Retrieve driver statistics including total, active, available, and busy counts',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Driver statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DriverStats' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/drivers/invitations': {
      get: {
        tags: ['Driver Invitations'],
        summary: 'List driver invitations',
        description: 'Retrieve all driver invitations with pagination and filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by invitation status',
            schema: { type: 'string', enum: ['pending', 'accepted', 'expired', 'cancelled'] }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search by email or name',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of driver invitations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DriverInvitation' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Driver Invitations'],
        summary: 'Create driver invitation',
        description: 'Send an invitation to a potential driver',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateInvitationData' }
            }
          }
        },
        responses: {
          201: {
            description: 'Invitation created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DriverInvitation' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid input data',
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
          409: {
            description: 'Conflict - Email already invited or registered',
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
      }
    },

    '/api/v1/drivers/invitations/stats': {
      get: {
        tags: ['Driver Invitations'],
        summary: 'Get invitation statistics',
        description: 'Retrieve statistics about driver invitations',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Invitation statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/InvitationStats' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/drivers/invitations/{id}': {
      get: {
        tags: ['Driver Invitations'],
        summary: 'Get invitation by ID',
        description: 'Retrieve a specific driver invitation by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Invitation ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Driver invitation details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DriverInvitation' }
                  }
                }
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
          404: {
            description: 'Invitation not found',
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
      }
    },

    '/api/v1/drivers/invitations/{id}/cancel': {
      patch: {
        tags: ['Driver Invitations'],
        summary: 'Cancel invitation',
        description: 'Cancel a pending driver invitation',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Invitation ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Invitation cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DriverInvitation' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Cannot cancel invitation',
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
          404: {
            description: 'Invitation not found',
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
      }
    },

    '/api/v1/drivers/invitations/bulk-cancel': {
      post: {
        tags: ['Driver Invitations'],
        summary: 'Bulk cancel invitations',
        description: 'Cancel multiple driver invitations at once',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invitationIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of invitation IDs to cancel'
                  }
                },
                required: ['invitationIds']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Bulk cancellation completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        cancelled: { type: 'integer', description: 'Number of successfully cancelled invitations' },
                        failed: { type: 'integer', description: 'Number of failed cancellations' },
                        errors: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              error: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid input data',
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/drivers/invitations/token/{token}': {
      get: {
        tags: ['Driver Invitations'],
        summary: 'Get invitation by token (public)',
        description: 'Retrieve invitation details using the invitation token (public endpoint)',
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Invitation token',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Invitation details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'accepted', 'expired', 'cancelled'] },
                        expiresAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          404: {
            description: 'Invitation not found',
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
      }
    },

    '/api/v1/drivers/accept-invitation': {
      post: {
        tags: ['Driver Invitations'],
        summary: 'Accept invitation (public)',
        description: 'Accept a driver invitation and create driver account (public endpoint)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', description: 'Invitation token' },
                  password: { type: 'string', minLength: 8, description: 'Driver password' },
                  phone: { type: 'string', description: 'Driver phone number' },
                  licenseNumber: { type: 'string', description: 'Driver license number' },
                  vehicleType: { 
                    type: 'string', 
                    enum: ['car', 'motorcycle', 'bicycle', 'truck', 'van'],
                    description: 'Vehicle type'
                  },
                  vehiclePlate: { type: 'string', description: 'Vehicle license plate' }
                },
                required: ['token', 'password', 'phone', 'licenseNumber', 'vehicleType', 'vehiclePlate']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Driver account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        driver: { $ref: '#/components/schemas/Driver' },
                        token: { type: 'string', description: 'JWT authentication token' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad Request - Invalid token or input data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          409: {
            description: 'Conflict - Invitation already accepted or expired',
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
      }
    },

    // Order Routes
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Get all orders',
        description: 'Retrieve all orders with pagination and filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by order status',
            schema: { type: 'string', enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'] }
          },
          {
            name: 'priority',
            in: 'query',
            description: 'Filter by order priority',
            schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
          },
          {
            name: 'driverId',
            in: 'query',
            description: 'Filter by assigned driver ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Orders'],
        summary: 'Create a new order',
        description: 'Create a new delivery order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerName: { type: 'string', example: 'John Customer' },
                  customerPhone: { type: 'string', example: '+1234567890' },
                  customerEmail: { type: 'string', format: 'email', example: 'customer@example.com' },
                  pickupAddress: { type: 'string', example: '123 Pickup St, City' },
                  deliveryAddress: { type: 'string', example: '456 Delivery Ave, City' },
                  pickupLocation: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number', example: 40.7128 },
                      longitude: { type: 'number', example: -74.0060 }
                    },
                    required: ['latitude', 'longitude']
                  },
                  deliveryLocation: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number', example: 40.7589 },
                      longitude: { type: 'number', example: -73.9851 }
                    },
                    required: ['latitude', 'longitude']
                  },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'medium' },
                  notes: { type: 'string', example: 'Handle with care' }
                },
                required: ['customerName', 'customerPhone', 'pickupAddress', 'deliveryAddress', 'pickupLocation', 'deliveryLocation']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Order created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Order created successfully' },
                    data: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          },
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by ID',
        description: 'Retrieve a specific order by its ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Order ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Order' }
                  }
                }
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
      }
    },

    // Geofence Routes
    '/api/v1/geofences': {
      get: {
        tags: ['Geofences'],
        summary: 'Get all geofences',
        description: 'Retrieve all geofences for the business',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Filter by geofence type',
            schema: { type: 'string', enum: ['delivery_zone', 'restricted_area', 'depot', 'customer_zone'] }
          }
        ],
        responses: {
          200: {
            description: 'List of geofences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        geofences: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Geofence' }
                        }
                      }
                    }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Geofences'],
        summary: 'Create a new geofence',
        description: 'Create a new geofence area',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Downtown Delivery Zone' },
                  type: { type: 'string', enum: ['delivery_zone', 'restricted_area', 'depot', 'customer_zone'], example: 'delivery_zone' },
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
                    example: [
                      { latitude: 40.7128, longitude: -74.0060 },
                      { latitude: 40.7589, longitude: -73.9851 },
                      { latitude: 40.7505, longitude: -73.9934 }
                    ]
                  },
                  radius: { type: 'number', example: 1000 }
                },
                required: ['name', 'type', 'coordinates']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Geofence created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Geofence created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        geofence: { $ref: '#/components/schemas/Geofence' }
                      }
                    }
                  }
                }
              }
            }
          },
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Dashboard Routes
    '/api/v1/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        description: 'Retrieve key performance metrics and statistics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for statistics',
            schema: { type: 'string', enum: ['7', '14', '30', '90'], default: '30' }
          }
        ],
        responses: {
          200: {
            description: 'Dashboard statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DashboardStats' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/v1/dashboard/activity': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get activity feed',
        description: 'Retrieve real-time activity feed',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of activity items to return',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          }
        ],
        responses: {
          200: {
            description: 'Activity feed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        activity: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              type: { type: 'string' },
                              message: { type: 'string' },
                              timestamp: { type: 'string', format: 'date-time' },
                              metadata: { type: 'object' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Location Routes
    '/api/v1/location/update': {
      post: {
        tags: ['Location'],
        summary: 'Update driver location',
        description: 'Update the current location of a driver',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  latitude: { type: 'number', example: 40.7128 },
                  longitude: { type: 'number', example: -74.0060 },
                  orderId: { type: 'string', example: 'order123' }
                },
                required: ['latitude', 'longitude']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Location updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Location' }
                  }
                }
              }
            }
          },
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
      }
    },

    '/api/v1/location/history': {
      get: {
        tags: ['Location'],
        summary: 'Get location history',
        description: 'Get location history for current driver',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
          },
          {
            name: 'orderId',
            in: 'query',
            description: 'Filter by order ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Location history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Location' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
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
      }
    },

    // Monitoring endpoints
    '/api/monitoring/health': {
      get: {
        tags: ['Monitoring'],
        summary: 'Health check',
        description: 'Check the health status of the API service',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthCheck' }
              }
            }
          },
          503: {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/ready': {
      get: {
        tags: ['Monitoring'],
        summary: 'Readiness check',
        description: 'Check if the service is ready to accept requests',
        responses: {
          200: {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ready' },
                    timestamp: { type: 'string', format: 'date-time' },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'string', example: 'connected' },
                        redis: { type: 'string', example: 'connected' }
                      }
                    }
                  }
                }
              }
            }
          },
          503: {
            description: 'Service is not ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/live': {
      get: {
        tags: ['Monitoring'],
        summary: 'Liveness check',
        description: 'Check if the service is alive and responding',
        responses: {
          200: {
            description: 'Service is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'alive' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/metrics': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get general metrics',
        description: 'Retrieve general system and application metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'General metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    system: {
                      type: 'object',
                      properties: {
                        uptime: { type: 'number', description: 'System uptime in seconds' },
                        memory: {
                          type: 'object',
                          properties: {
                            rss: { type: 'number' },
                            heapTotal: { type: 'number' },
                            heapUsed: { type: 'number' },
                            external: { type: 'number' }
                          }
                        },
                        cpu: {
                          type: 'object',
                          properties: {
                            usage: { type: 'number', description: 'CPU usage percentage' }
                          }
                        }
                      }
                    },
                    application: {
                      type: 'object',
                      properties: {
                        version: { type: 'string' },
                        environment: { type: 'string' },
                        startTime: { type: 'string', format: 'date-time' }
                      }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/metrics/system': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get system metrics',
        description: 'Retrieve detailed system performance metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'System metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    memory: {
                      type: 'object',
                      properties: {
                        rss: { type: 'number', description: 'Resident Set Size' },
                        heapTotal: { type: 'number', description: 'Total heap size' },
                        heapUsed: { type: 'number', description: 'Used heap size' },
                        external: { type: 'number', description: 'External memory' },
                        arrayBuffers: { type: 'number', description: 'Array buffers' }
                      }
                    },
                    cpu: {
                      type: 'object',
                      properties: {
                        user: { type: 'number' },
                        system: { type: 'number' }
                      }
                    },
                    uptime: { type: 'number', description: 'Process uptime in seconds' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/metrics/app': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get application metrics',
        description: 'Retrieve application-specific metrics and statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Application metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requests: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', description: 'Total requests processed' },
                        successful: { type: 'number', description: 'Successful requests' },
                        failed: { type: 'number', description: 'Failed requests' },
                        rate: { type: 'number', description: 'Requests per minute' }
                      }
                    },
                    database: {
                      type: 'object',
                      properties: {
                        connections: { type: 'number', description: 'Active database connections' },
                        queries: { type: 'number', description: 'Total queries executed' }
                      }
                    },
                    cache: {
                      type: 'object',
                      properties: {
                        hits: { type: 'number', description: 'Cache hits' },
                        misses: { type: 'number', description: 'Cache misses' },
                        hitRate: { type: 'number', description: 'Cache hit rate percentage' }
                      }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/metrics/performance': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get performance metrics',
        description: 'Retrieve performance metrics including response times and throughput',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Performance metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    responseTime: {
                      type: 'object',
                      properties: {
                        average: { type: 'number', description: 'Average response time in ms' },
                        p95: { type: 'number', description: '95th percentile response time in ms' },
                        samples: { type: 'number', description: 'Number of samples' }
                      }
                    },
                    requests: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', description: 'Total requests in timeframe' },
                        timeframe: { type: 'string', description: 'Timeframe description' }
                      }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
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
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/monitoring/logs': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get application logs',
        description: 'Retrieve application logs (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'level',
            in: 'query',
            description: 'Log level filter',
            schema: { 
              type: 'string', 
              enum: ['error', 'warn', 'info', 'debug'], 
              default: 'info' 
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of log entries to return',
            schema: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 1000, 
              default: 100 
            }
          },
          {
            name: 'since',
            in: 'query',
            description: 'ISO timestamp to filter logs from',
            schema: { 
              type: 'string', 
              format: 'date-time' 
            }
          }
        ],
        responses: {
          200: {
            description: 'Application logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    level: { type: 'string', description: 'Requested log level' },
                    limit: { type: 'integer', description: 'Requested limit' },
                    since: { type: 'string', format: 'date-time', description: 'Requested since timestamp' },
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string', format: 'date-time' },
                          level: { type: 'string' },
                          message: { type: 'string' },
                          metadata: { type: 'object' }
                        }
                      }
                    },
                    message: { type: 'string', description: 'Additional information' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
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
            description: 'Forbidden - Admin access required',
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
      }
    }
  }
};