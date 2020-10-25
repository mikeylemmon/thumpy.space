build-and-push: build push

build:
	yarn build

push:
	rsync -aP ./build/* ./public/.htaccess fritzherald@207.38.86.26:webapps/thump_client2/
