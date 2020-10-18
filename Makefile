build:
	cd client-web && yarn build
	rm -rf docs && cp -r client-web/build docs
