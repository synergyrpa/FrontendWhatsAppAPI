#!/bin/bash

nvm use 20
npm run build
aws s3 sync dist/ s3://whatsapp-service-frontend-bucket-dev