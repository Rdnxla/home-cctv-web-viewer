// Non-trickle ICE: the SDP is sent once, so wait for candidates, but never longer than 2 s
export function waitForIceGathering(pc: RTCPeerConnection) {
  return new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
    setTimeout(resolve, 2000);
  });
}
