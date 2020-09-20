package api

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const WS_HEADER_END = `#`

func init() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout}).With().Caller().Logger()
}
