#!/bin/bash

mkdir -p /var/nginx/client_body_temp
mkdir -p /var/run/php/
touch /var/log/php-fpm.log
#chown www-data:www-data /var/log/php-fpm.log

exec supervisord --nodaemon --configuration="/etc/supervisor/supervisord.conf" --loglevel=info
