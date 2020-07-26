# demo-integration

## Install
- npm install

## Usage
- Create an .env file with variables:
    * ISSUE_ID
    * SENTRY_TOKEN 
    * ORGANIZATION_SLUG 
    * PROJECT_SLUG 
    * STAGE_TAG
    * STAGE
    * REGION
    * FACTURADOR_TOKEN
    * S3_BUCKET 
- Run command
    * node report
    Esto generará un reporte listaDTEs.csv en la raíz del proyecto
    * node download
    Esto volverá a descargar los pdfs listados en el reporte generado anteriormente