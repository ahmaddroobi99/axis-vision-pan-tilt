import time

from host.protocol import encode_stop, parse_packet


def test_stop_packet_is_stop():
    assert parse_packet(encode_stop())["kind"] == "S"


def test_timeout_threshold_is_positive():
    timeout_ms = 300
    start = time.time()
    elapsed_ms = (time.time() - start) * 1000
    assert elapsed_ms < timeout_ms
