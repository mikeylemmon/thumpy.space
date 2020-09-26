package api

import (
	"encoding/json"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const (
	WS_HEADER_END = `#`
	WS_CLIENT_ID  = `client/id`
)

func init() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout}).With().Caller().Logger()
}

type ClientIdResp struct {
	ClientId int `json:"clientId"`
}

func HandleClientId(clientId int) ([]byte, error) {
	resp, err := json.Marshal(ClientIdResp{ClientId: clientId})
	if err != nil {
		return nil, err
	}
	log.Debug().Int(`clientId`, clientId).Msg(`Sending clientId`)
	return []byte(WS_CLIENT_ID + WS_HEADER_END + string(resp)), nil
}
