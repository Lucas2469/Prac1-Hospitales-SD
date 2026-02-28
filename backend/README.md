Storage Cluster Monitor – Backend (Módulo 3)

Descripción

Este proyecto forma parte del sistema distribuido de monitoreo de almacenamiento para la Caja Nacional de Salud (CNS).

Este repositorio contiene el Backend del Nodo Central (Monitoring Node) encargado de:

Registrar clientes (nodos regionales)

Detectar nodos activos / inactivos

Guardar historial de métricas de disco

Consolidar métricas globales del cluster

Recibir logs de clientes

Exponer API REST para el Dashboard

Base de datos utilizada: MongoDB Atlas (cloud)
Arquitectura: Cliente–Servidor con monitoreo centralizado

Arquitectura Implementada

Backend construido con:

Node.js

Express

MongoDB (Mongoose)

dotenv

Arquitectura modular (routes / controllers / models)

Estructura principal:

backend/
│
├── server.js
├── .env
└── src/
    ├── models/
    │   ├── Client.js
    │   ├── Metric.js
    │   └── Log.js
    │
    ├── controllers/
    │   ├── clients.controller.js
    │   ├── metrics.controller.js
    │   └── logs.controller.js
    │
    ├── routes/
    │   ├── clients.routes.js
    │   ├── metrics.routes.js
    │   └── logs.routes.js
    │
    └── services/
        └── heartbeat.service.js

Configuración de Base de Datos

La base de datos está en MongoDB Atlas.

Para que funcione:

IP Access List incluye:

0.0.0.0/0

(permite conexión desde cualquier red)

Desde la carpeta backend:

npm install
npm run dev

El servidor correrá en:

http://localhost:4000
Endpoints Implementados
CLIENTES
Registrar cliente

POST

/api/clients/register

Body:

{
  "clientId": "reg-01",
  "ipAddress": "192.168.0.10",
  "region": "Cochabamba"
}
Obtener lista de clientes

GET

/api/clients
Asignar alias

PATCH

/api/clients/:clientId/alias
Heartbeat (marca nodo activo)

POST

/api/clients/:clientId/heartbeat

El sistema marca automáticamente como:

ACTIVE

NO_REPORTA

según HEARTBEAT_THRESHOLD.

MÉTRICAS (Historial obligatorio)
Reportar métricas de disco

POST

/api/metrics/report

Body:

{
  "clientId": "reg-01",
  "disks": [
    {
      "name": "C:",
      "type": "SSD",
      "total": 500,
      "used": 200,
      "free": 300,
      "percent": 40
    }
  ]
}

Guarda:

Historial

Timestamp

Snapshot de estado

Historial por nodo

GET

/api/metrics/history?clientId=reg-01
Resumen global del cluster

GET

/api/metrics/cluster-summary

Devuelve:

Capacidad total

Espacio usado

Espacio libre

%global

Último reporte por nodo

LOGS (Extensión de complejidad)
Ingesta de logs desde cliente

POST

/api/logs/ingest

Body:

{
  "clientId": "reg-01",
  "logs": [
    { "level": "INFO", "message": "Cliente reconectado" }
  ]
}
Obtener logs

GET

/api/logs?clientId=reg-01


📊 Modelo de Datos
Client

clientId

ipAddress

region

alias

lastSeenAt

status (ACTIVE / NO_REPORTA)

Metric

clientId

timestamp

disks[]

statusSnapshot

Log

clientId

timestamp

level

message
