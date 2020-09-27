package api

import (
	"encoding/json"
	"net"
	"os"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const (
	WS_HEADER_END = `#`
	WS_CLIENT_ID  = `client/id`
)

func init() {
	// log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout}).With().Caller().Logger()
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
}

type ClientIdResp struct {
	ClientId int `json:"clientId"`
}

func SendClientId(conn net.Conn, clientId int) error {
	resp, err := json.Marshal(ClientIdResp{ClientId: clientId})
	if err != nil {
		return err
	}
	log.Debug().Int(`clientId`, clientId).Msg(`Sending clientId`)
	msg := []byte(WS_CLIENT_ID + WS_HEADER_END + string(resp))
	return wsutil.WriteServerMessage(conn, ws.OpText, msg)
}
