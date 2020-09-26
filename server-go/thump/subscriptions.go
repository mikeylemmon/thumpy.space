package main

import (
	"encoding/json"
	"fmt"

	"bitbucket.org/mlem/cmpo385/thump/server-go/api"
	"github.com/rs/zerolog/log"
)

type Subscription struct {
	ClientId int
	Messages chan []byte
	User     *api.User
}

type Event struct {
	Kind       string
	FromClient int
	User       *api.User
	Users      []*api.User
}

func NewSubscription(cid int) *Subscription {
	return &Subscription{
		ClientId: cid,
		Messages: make(chan []byte),
	}
}

var (
	subs   = make(map[int]*Subscription)
	addSub = make(chan *Subscription)
	rmSub  = make(chan *Subscription)
	events = make(chan Event, 512) // set a big buffer on the events queue
)

func runSubscriptionLoop() {
	for {
		select {
		case sub := <-addSub:
			subs[sub.ClientId] = sub
			log.Info().Int(`clientId`, sub.ClientId).Msg(`Added subscription`)
		case sub := <-rmSub:
			delete(subs, sub.ClientId)
			log.Info().Int(`clientId`, sub.ClientId).Msg(`Removed subscription`)
		case evt := <-events:
			if evt.User != nil {
				// special case for user updates
				handleEventUserUpdate(evt)
				continue
			}
			log.Error().Interface(`evt`, evt).Msg(`Received unsupported event type`)
			// bites, err := json.Marshal(evt)
			// if err != nil {
			// 	log.Error().Err(err).Interface(`evt`, evt).Msg(`Failed to encode event`)
			// 	continue
			// }
			// msg := []byte(evt.Kind + api.WS_HEADER_END + string(bites))
			// for _, sub := range subs {
			// 	sub.Messages <- msg
			// }
			// log.Info().Interface(`evt`, evt).Int(`numClients`, len(subs)).Msg(`Sent event`)
		}
	}
}

func handleEventUserUpdate(evt Event) {
	if sub, ok := subs[evt.FromClient]; ok {
		sub.User = evt.User
	} else {
		log.Error().Err(fmt.Errorf(`subscription not found`)).Interface(`evt`, evt).Msg(`Invalid user update`)
		return
	}
	users := []*api.User{}
	for _, sub := range subs {
		users = append(users, sub.User)
	}
	bites, err := json.Marshal(users)
	if err != nil {
		log.Error().Err(err).Interface(`users`, users).Msg(`Failed to encode all users`)
		return
	}
	msg := []byte(api.WS_USERS_ALL + api.WS_HEADER_END + string(bites))
	for _, sub := range subs {
		sub.Messages <- msg
	}
	log.Info().Interface(`evt`, evt).Int(`numClients`, len(subs)).Msg(`Sent event`)
}
