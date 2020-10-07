package api

import (
	"encoding/json"
	"net"
	"sync"
	"time"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/rs/zerolog/log"
)

const (
	WS_CLOCK_NOW    = `clock/now`
	WS_CLOCK_ORIGIN = `clock/origin`
	WS_CLOCK_UPDATE = `clock/update`
)

type ClockOpts struct {
	BPM float64 `json:"bpm"`
}

type ClockNowResp struct {
	NowMs float64 `json:"nowMs"`
}

type ClockOriginResp struct {
	OriginMs float64 `json:"originMs"`
}

func nanoToMs(nano int64) float64 { return float64(nano) / 1000000.0 }

var (
	_clock      = ClockOpts{BPM: 95}
	_clockMutex = sync.RWMutex{}
	origin      = nanoToMs(time.Now().UnixNano())
)

func UpdateClock(clk *ClockOpts) {
	_clockMutex.Lock()
	defer _clockMutex.Unlock()
	_clock = *clk
}

func Clock() ClockOpts {
	_clockMutex.RLock()
	defer _clockMutex.RUnlock()
	clk := _clock
	return clk
}

func Now() float64 { return nanoToMs(time.Now().UnixNano()) - origin }

func HandleClockNow() ([]byte, error) {
	resp, err := json.Marshal(ClockNowResp{NowMs: Now()})
	if err != nil {
		return nil, err
	}
	return []byte(WS_CLOCK_NOW + WS_HEADER_END + string(resp)), nil
}

func SendClockOrigin(conn net.Conn) error {
	resp, err := json.Marshal(ClockOriginResp{OriginMs: origin})
	if err != nil {
		return err
	}
	log.Debug().Float64(`origin`, origin).Msg(`Sending time origin`)
	msg := []byte(WS_CLOCK_ORIGIN + WS_HEADER_END + string(resp))
	return wsutil.WriteServerMessage(conn, ws.OpText, msg)
}

func ParseClockUpdate(body string) (*ClockOpts, error) {
	bpm := &ClockOpts{}
	if err := json.Unmarshal([]byte(body), bpm); err != nil {
		return nil, err
	}
	return bpm, nil
}

func SendClockUpdate(conn net.Conn) error {
	clk := Clock()
	resp, err := json.Marshal(&clk)
	if err != nil {
		return err
	}
	log.Debug().Interface(`clock`, &clk).Msg(`Sending clock settings`)
	msg := []byte(WS_CLOCK_UPDATE + WS_HEADER_END + string(resp))
	return wsutil.WriteServerMessage(conn, ws.OpText, msg)
}
