package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"

	"bitbucket.org/mlem/cmpo385/thump/server-go/api"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"
)

func init() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout}).With().Caller().Logger()
}

func main() {
	app := &cli.App{
		Name:    `thump`,
		Version: `0.1.0`,
		Usage:   `a server implementation for the web-based A/V workstation`,
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  `port`,
				Usage: `port on which the server will listen for http requests`,
				Value: `38883`,
			},
		},
		Action: mainAction,
	}
	if err := app.Run(os.Args); err != nil {
		log.Error().Err(err).Msg(`Something went wrong`)
		fmt.Println(err)
		os.Exit(1)
	}
}

func mainAction(cc *cli.Context) error {
	port := cc.String(`port`)
	log.Info().Str(`port`, port).Msg(`listening for client connections`)

	go runSubscriptionLoop()
	go runRoboUser1()

	http.ListenAndServe(`:`+port, http.HandlerFunc(handleWS))

	log.Info().Msg(`Goodbye`)

	return nil
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		log.Error().Err(err).Msg(`Failed to upgrade websocket connection`)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	go handleWSConn(conn)
}

var clientId = 0

func nextClientId() int {
	cid := clientId
	clientId++
	return cid
}

func handleWSConn(conn net.Conn) {
	cid := nextClientId()
	log := log.With().Int(`clientId`, cid).Logger()
	log.Info().Msg(`New client connection`)

	sub := NewSubscription(cid)
	addSub <- sub // add event bus subscription

	quit := make(chan struct{})
	defer func() {
		rmSub <- sub // remove the event bus subscription
		close(quit)  // quit the send-message loop
		conn.Close() // close the connection
	}()
	var errBreaker error

	go func() {
		if err := api.SendClockOrigin(conn); err != nil {
			log.Error().Err(err).Msg(`Failed to send clock origin`)
			errBreaker = err
			return
		}
		if err := api.SendClientId(conn, cid); err != nil {
			log.Error().Err(err).Msg(`Failed to send clientId`)
			errBreaker = err
			return
		}
		if err := api.SendClockUpdate(conn); err != nil {
			log.Error().Err(err).Msg(`Failed to send clock settings`)
			errBreaker = err
			return
		}

		nErrs := 0
		for {
			select {
			case bites := <-sub.Messages:
				if err := wsutil.WriteServerMessage(conn, ws.OpText, bites); err != nil {
					log.Error().Err(err).Msg(`Failed to send client message`)
					nErrs++
					if nErrs > 5 {
						log.Error().Msg(`Failed to send too many times, closing connection`)
						errBreaker = err
						return
					}
				}
			case <-quit:
				return
			}
		}
	}()

	for {
		if errBreaker != nil {
			break
		}
		bites, op, err := wsutil.ReadClientData(conn)
		if err != nil {
			log.Error().Err(err).Msg(`Failed to read client message`)
			break
		}
		parts := strings.SplitN(string(bites), api.WS_HEADER_END, 2)
		head := parts[0]
		body := ``
		if len(parts) > 1 {
			body = parts[1]
		}
		switch head {
		case api.WS_CLOCK_NOW:
			resp, err := api.HandleClockNow()
			if err != nil {
				log.Error().Err(err).Msg(`Failed to handle ClockNow request`)
				continue
			}
			wsutil.WriteServerMessage(conn, ws.OpText, resp)
		case api.WS_CLOCK_UPDATE:
			clk, err := api.ParseClockUpdate(body)
			if err != nil {
				log.Error().Err(err).Str(`body`, body).Msg(`Failed to parse clock update`)
				continue
			}
			events <- Event{
				Kind:       head,
				FromClient: cid,
				Clock:      clk,
				Raw:        bites,
			}
		case api.WS_USER_UPDATE:
			user, err := api.ParseUserUpdate(body)
			if err != nil {
				log.Error().Err(err).Str(`body`, body).Msg(`Failed to parse user update`)
				continue
			}
			events <- Event{
				Kind:       head,
				FromClient: cid,
				User:       user,
			}
		case api.WS_USER_EVENT:
			events <- Event{
				Kind:       head,
				FromClient: cid,
				Raw:        bites,
			}
		default:
			log.Debug().
				Interface(`op`, op).
				Str(`head`, string(head)).
				Str(`body`, body).
				Str(`bites`, string(bites)).
				Msg(`Unhandled message`)
		}
	}
	log.Info().Msg(`Connection closed`)
}
