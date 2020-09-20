package main

type Clock struct {
	BPM          float64
	TimeSigNum   int32
	TimeSigDenom int32
	OriginMs     int64
	Playhead     struct {
		StartedAtMs  float64
		OffsetBeats  int64
		OffsetSubeat float64
	}
}
