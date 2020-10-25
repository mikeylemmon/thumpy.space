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
	SkipSource bool
	Clock      *api.ClockOpts
	User       *api.User
	Users      []*api.User
	Raw        []byte
}

func NewSubscription(cid int) *Subscription {
	return &Subscription{
		ClientId: cid,
		Messages: make(chan []byte, 512),
	}
}

func NewRoboSubscription(cid int) *Subscription {
	return &Subscription{
		ClientId: cid,
		Messages: nil,
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
			sendUsers()
		case evt := <-events:
			if evt.Clock != nil {
				api.UpdateClock(evt.Clock)
			}
			if evt.Raw != nil {
				for _, sub := range subs {
					if evt.SkipSource && sub.ClientId == evt.FromClient {
						continue
					}
					if sub.Messages == nil {
						continue // skip robo subscriptions
					}
					select {
					case sub.Messages <- evt.Raw:
					default:
						log.Warn().Int(`clientId`, sub.ClientId).Str(`kind`, evt.Kind).Msg(`Subscription refuses message`)
					}
				}
				// log.Info().Str(`kind`, evt.Kind).Int(`from`, evt.FromClient).Int(`numClients`, len(subs)).Msg(`Sent raw event`)
				continue
			}
			if evt.User != nil {
				// special case for user updates
				handleEventUserUpdate(evt)
				continue
			}
			log.Error().Interface(`evt`, evt).Msg(`Received unsupported event type`)
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
	log.Info().Interface(`user`, evt.User).Msg(`User updated`)
	sendUsers()
}

func sendUsers() {
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
		if sub.Messages == nil {
			continue // skip robo subscriptions
		}
		select {
		case sub.Messages <- msg:
		default:
			log.Warn().Int(`clientId`, sub.ClientId).Str(`kind`, api.WS_USERS_ALL).Msg(`Subscription refuses message`)
		}
	}
	log.Info().Int(`numClients`, len(subs)).Msg(`Sent updated users list`)
}
