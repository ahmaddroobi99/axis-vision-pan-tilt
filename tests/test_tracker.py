from host.tracker import apply_deadband, compute_normalized_error, exp_smooth


def test_center_is_zero():
    nx, ny, _ = compute_normalized_error(320, 240, 640, 480)
    assert nx == 0.0 and ny == 0.0


def test_left_is_negative():
    nx, ny, _ = compute_normalized_error(0, 240, 640, 480)
    assert nx == -1.0


def test_deadband():
    assert apply_deadband(0.03, 0.05) == 0.0
    assert apply_deadband(0.2, 0.05) != 0.0


def test_smooth():
    assert exp_smooth(0.0, 1.0, 0.25) == 0.25
