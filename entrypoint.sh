#!/bin/bash

envsubst < /usr/share/nginx/html/assets/config/envvars.tpl.json > /usr/share/nginx/html/assets/config/envvars.json && nginx -g 'daemon off;'
