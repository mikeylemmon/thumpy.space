build-linux:
	GOOS=linux GOARCH=amd64 go build -o thump_linux_64

push:
	scp ./thump_linux_64 fritzherald@207.38.86.26:webapps/thump/thump.next
	ssh -t fritzherald@207.38.86.26 cp webapps/thump/thump webapps/thump/thump.prev

restart:
	ssh -t fritzherald@207.38.86.26 mv webapps/thump/thump.next webapps/thump/thump
	ssh -t fritzherald@207.38.86.26 killall thump

logs:
	ssh -t fritzherald@207.38.86.26 tail -f -n +1 webapps/thump/log.txt

ssh:
	ssh fritzherald@207.38.86.26
