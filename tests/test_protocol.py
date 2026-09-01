from host.protocol import encode_stop, encode_target, parse_packet, xor_checksum


def test_roundtrip():
    raw = encode_target(0.5, -0.25, 99)
    pkt = parse_packet(raw)
    assert pkt["kind"] == "T"
    assert abs(pkt["x"] - 0.5) < 1e-6
    assert abs(pkt["y"] + 0.25) < 1e-6
    assert pkt["timestamp"] == 99


def test_bad_checksum():
    try:
        parse_packet("$T,0.1,0.1,1*00\r\n")
        raise AssertionError("should reject")
    except ValueError:
        pass


def test_out_of_range():
    payload = "T,1.5,0.0,1"
    raw = f"${payload}*{xor_checksum(payload)}\r\n"
    try:
        parse_packet(raw)
        raise AssertionError("should reject")
    except ValueError:
        pass


def test_stop():
    assert parse_packet(encode_stop())["kind"] == "S"


def test_clamp_on_encode():
    pkt = parse_packet(encode_target(5, -9, 0))
    assert pkt["x"] == 1.0
    assert pkt["y"] == -1.0
