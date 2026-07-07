import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'app/api', // المجلد الذي يحتوي على مسارات الـ API
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'NSSCP System API Documentation',
                version: '1.0.0',
            },
        },
    });
    return spec;
};