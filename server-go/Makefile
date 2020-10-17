THUMP = /usr/local/bin/thump
SERVER = root@thumpy.space

build:
	GOOS=linux GOARCH=amd64 go build -o thump_linux_64 ./thump

push:
	scp thump_linux_64 $(SERVER):$(THUMP).next
	ssh -t $(SERVER) cp $(THUMP) $(THUMP).prev.$$(date +%Y-%m-%d-%H%M%S)

restart:
	ssh -t $(SERVER) mv $(THUMP).next $(THUMP)
	ssh -t $(SERVER) cp $(THUMP) $(THUMP).next
	ssh -t $(SERVER) setcap CAP_NET_BIND_SERVICE=+eip $(THUMP)
	ssh -t $(SERVER) systemctl restart thump

logs:
	ssh -t $(SERVER) journalctl -f -u thump

ssh:
	ssh $(SERVER)

push-systemd-unit:
	scp thump.service $(SERVER):/lib/systemd/system/thump.service
	ssh -t $(SERVER) systemctl enable thump
