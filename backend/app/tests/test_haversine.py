from app.utils.haversine import calculate_haversine

def test_haversine():
    dist_near = calculate_haversine(38.0, 15.0, 38.05, 15.05)
    print(f"Test 1 (Near): {dist_near} km")
    assert 7.0 < dist_near < 9.0, "Near test failed!"

    dist_zero = calculate_haversine(38.0, 15.0, 38.0, 15.0)
    print(f"Test 2 (Same): {dist_zero} km")
    assert dist_zero == 0, "Zero distance test failed!"

    dist_far = calculate_haversine(38.0, 15.0, 51.5, -0.12)
    print(f"Test 3 (Far): {dist_far} km")
    assert dist_far > 100, "Far test failed - should be > 100km"

    print("\n All Haversine tests passed!")

if __name__ == "__main__":
    test_haversine()
    