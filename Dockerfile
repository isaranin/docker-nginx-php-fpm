FROM php:7.1-fpm

LABEL author = "Ivan Saranin" \
	  email =  "ivan@saranin.com"

ENV NGINX_VERSION 1.13.1-1~jessie
ENV NJS_VERSION   1.13.1.0.1.10-1~jessie

RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y gnupg2 \
	&& \
	NGINX_GPGKEY=573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62; \
	found=''; \
	for server in \
		ha.pool.sks-keyservers.net \
		hkp://keyserver.ubuntu.com:80 \
		hkp://p80.pool.sks-keyservers.net:80 \
		pgp.mit.edu \
	; do \
		echo "Fetching GPG key $NGINX_GPGKEY from $server"; \
		apt-key adv --keyserver "$server" --keyserver-options timeout=10 --recv-keys "$NGINX_GPGKEY" && found=yes && break; \
	done; \
	test -z "$found" && echo >&2 "error: failed to fetch GPG key $NGINX_GPGKEY" && exit 1; \
	apt-get remove --purge -y gnupg2 && apt-get -y --purge autoremove && rm -rf /var/lib/apt/lists/* \
	&& echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list \
	&& apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
						nginx=${NGINX_VERSION} \
						nginx-module-xslt=${NGINX_VERSION} \
						nginx-module-geoip=${NGINX_VERSION} \
						nginx-module-image-filter=${NGINX_VERSION} \
						nginx-module-njs=${NJS_VERSION} \
						gettext-base \
						supervisor \
	&& rm -rf /var/lib/apt/lists/*

# Copy etc
COPY etc /etc/

# Copy main script
COPY run.sh /run.sh
RUN chmod u+rwx /run.sh

EXPOSE 80
VOLUME ["/log","/www", "/etc/nginx/", "/etc/php-fpm"]
CMD ["/bin/bash", "/run.sh"]