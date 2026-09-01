from host.controller import PID


def test_p_proportional():
    pid = PID(kp=2.0, ki=0.0, kd=0.0)
    assert pid.update(0.5, 0.01) == 1.0


def test_output_clamped():
    pid = PID(kp=10.0)
    assert pid.update(1.0, 0.01) == 1.0
    assert pid.update(-1.0, 0.01) == -1.0
