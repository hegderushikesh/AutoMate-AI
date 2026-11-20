-- ============================================================================
-- AutoMate AI - Realistic Automotive Seed Data (03_seed_data.sql)
-- Contains high-detail structured engineering specifications across ICE & EV
-- ============================================================================

DO $$
DECLARE
    v_taycan_id UUID := gen_random_uuid();
    v_m3_id UUID := gen_random_uuid();
    v_ioniq5_id UUID := gen_random_uuid();
    v_lightning_id UUID := gen_random_uuid();
BEGIN
    -- 1. Porsche Taycan (Electric Sports Sedan)
    INSERT INTO vehicles (id, make, model, year, body_type, category, price_range, hero_image_url, overview)
    VALUES (
        v_taycan_id,
        'Porsche',
        'Taycan',
        2025,
        'Sedan',
        'Electric',
        '$99,400 - $211,700',
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
        'The Porsche Taycan combines iconic Porsche sports car dynamics with cutting-edge 800-volt high-performance electric architecture, blistering acceleration, and advanced recuperation.'
    ) ON CONFLICT (make, model, year) DO NOTHING;

    -- Taycan Trims
    INSERT INTO variants (vehicle_id, trim_name, price, engine_type, displacement_cc, horsepower_hp, torque_nm, transmission, drivetrain, fuel_type, fuel_economy, seating_capacity, safety_rating_ncap, key_features, dimensions)
    VALUES
    (
        v_taycan_id,
        'Taycan Base RWD',
        99400.00,
        'Permanent Magnet Synchronous Motor (Rear)',
        NULL,
        402,
        410,
        '2-Speed Rear Axle Transmission',
        'RWD',
        'Electric',
        '83 MPGe (EPA Combined)',
        4,
        '5-Star',
        '["Adaptive Air Suspension with PASM", "Porsche Recuperation Management (PRM)", "Curved 16.8-inch Digital Instrument Cluster", "LED Headlights with PDLS Plus", "Wireless Apple CarPlay and Android Auto"]'::jsonb,
        '{"length_mm": 4963, "width_mm": 1966, "height_mm": 1395, "wheelbase_mm": 2900, "curb_weight_kg": 2050, "battery_kwh": 89.0, "range_miles": 274}'::jsonb
    ),
    (
        v_taycan_id,
        'Taycan 4S AWD',
        118500.00,
        'Dual Permanent Magnet Synchronous Motors',
        NULL,
        536,
        695,
        '1-Speed Front / 2-Speed Rear Transmission',
        'AWD',
        'Electric',
        '82 MPGe (EPA Combined)',
        4,
        '5-Star',
        '["Porsche Traction Management (PTM)", "Performance Battery Plus (105 kWh)", "Adaptive 18-way Sport Seats Plus", "Bose Surround Sound System", "Lane Change Assist"]'::jsonb,
        '{"length_mm": 4963, "width_mm": 1966, "height_mm": 1379, "wheelbase_mm": 2900, "curb_weight_kg": 2180, "battery_kwh": 105.0, "range_miles": 318}'::jsonb
    ),
    (
        v_taycan_id,
        'Taycan Turbo S',
        209000.00,
        'Dual High-Output PSM Motors with Launch Overboost',
        NULL,
        938,
        1110,
        '2-Speed High-Torque Performance Transmission',
        'AWD',
        'Electric',
        '78 MPGe (EPA Combined)',
        4,
        '5-Star',
        '["Porsche Ceramic Composite Brakes (PCCB)", "Rear-Axle Steering with Power Steering Plus", "Porsche Dynamic Chassis Control Sport (PDCC Sport)", "Carbon Fiber Aerodynamic Package", "0-60 mph in 2.3 seconds"]'::jsonb,
        '{"length_mm": 4963, "width_mm": 1966, "height_mm": 1378, "wheelbase_mm": 2900, "curb_weight_kg": 2295, "battery_kwh": 105.0, "range_miles": 295}'::jsonb
    ) ON CONFLICT (vehicle_id, trim_name) DO NOTHING;

    -- 2. BMW 3 Series (Sport Luxury Sedan - ICE)
    INSERT INTO vehicles (id, make, model, year, body_type, category, price_range, hero_image_url, overview)
    VALUES (
        v_m3_id,
        'BMW',
        '3 Series',
        2025,
        'Sedan',
        'Gasoline',
        '$45,500 - $61,500',
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
        'The quintessential luxury sports sedan offering legendary 50:50 weight distribution, BMW Curved Display with iDrive 8.5, and responsive TwinPower Turbo propulsion.'
    ) ON CONFLICT (make, model, year) DO NOTHING;

    INSERT INTO variants (vehicle_id, trim_name, price, engine_type, displacement_cc, horsepower_hp, torque_nm, transmission, drivetrain, fuel_type, fuel_economy, seating_capacity, safety_rating_ncap, key_features, dimensions)
    VALUES
    (
        v_m3_id,
        '330i xDrive',
        47500.00,
        '2.0-liter BMW TwinPower Turbo Inline 4-Cylinder',
        1998,
        255,
        400,
        '8-Speed Sport Automatic with Paddle Shifters',
        'AWD',
        'Premium Unleaded',
        '24 MPG City / 33 MPG Hwy',
        5,
        '5-Star',
        '["BMW Curved Display (12.3-inch + 14.9-inch)", "Active Blind Spot Detection", "Frontal Collision Warning with City Collision Mitigation", "Moonroof", "Comfort Access Keyless Entry"]'::jsonb,
        '{"length_mm": 4713, "width_mm": 1827, "height_mm": 1440, "wheelbase_mm": 2851, "curb_weight_kg": 1690, "cargo_liters": 480}'::jsonb
    ),
    (
        v_m3_id,
        'M340i xDrive',
        61500.00,
        '3.0-liter BMW M TwinPower Turbo Inline 6-Cylinder with 48V Mild Hybrid',
        2998,
        386,
        540,
        '8-Speed Sport Automatic with Launch Control',
        'AWD',
        'Premium Unleaded',
        '23 MPG City / 31 MPG Hwy',
        5,
        '5-Star',
        '["M Sport Differential", "Adaptive M Suspension", "Variable Sport Steering", "M Sport Brakes with Blue Calipers", "Aerodynamic Kit"]'::jsonb,
        '{"length_mm": 4713, "width_mm": 1827, "height_mm": 1440, "wheelbase_mm": 2851, "curb_weight_kg": 1795, "cargo_liters": 480}'::jsonb
    ) ON CONFLICT (vehicle_id, trim_name) DO NOTHING;

    -- 3. Hyundai Ioniq 5 (All-Electric Crossover)
    INSERT INTO vehicles (id, make, model, year, body_type, category, price_range, hero_image_url, overview)
    VALUES (
        v_ioniq5_id,
        'Hyundai',
        'Ioniq 5',
        2025,
        'SUV',
        'Electric',
        '$42,500 - $66,100',
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80',
        'Retro-futuristic electric crossover built on the E-GMP platform with ultra-fast 350kW DC fast charging (10% to 80% in 18 minutes) and Vehicle-to-Load (V2L) two-way charging.'
    ) ON CONFLICT (make, model, year) DO NOTHING;

    INSERT INTO variants (vehicle_id, trim_name, price, engine_type, displacement_cc, horsepower_hp, torque_nm, transmission, drivetrain, fuel_type, fuel_economy, seating_capacity, safety_rating_ncap, key_features, dimensions)
    VALUES
    (
        v_ioniq5_id,
        'SEL Long Range AWD',
        51200.00,
        'Dual Electric Motors (Front & Rear)',
        NULL,
        320,
        605,
        'Single-Speed Reduction Gear',
        'AWD',
        'Electric',
        '101 MPGe Combined',
        5,
        '5-Star',
        '["Highway Driving Assist II (HDA II)", "Hands-free Smart Power Liftgate", "Wireless Phone Charger", "Ultra-fast 800V Multi-Charging Architecture", "Heated Front Seats and Steering Wheel"]'::jsonb,
        '{"length_mm": 4635, "width_mm": 1890, "height_mm": 1605, "wheelbase_mm": 3000, "curb_weight_kg": 2095, "battery_kwh": 84.0, "range_miles": 269}'::jsonb
    ),
    (
        v_ioniq5_id,
        'Ioniq 5 N',
        66100.00,
        'Dual High-Output High-RPM Motors with N Grin Boost',
        NULL,
        641,
        770,
        'Single-Speed with N e-Shift Virtual 8-Speed Paddle Transmission',
        'AWD',
        'Electric',
        '78 MPGe Combined',
        5,
        '5-Star',
        '["N e-Shift & N Active Sound+", "N Drift Optimizer", "N Torque Distribution (11-level)", "Track-tuned Electronically Controlled Suspension", "400mm Front Discs with 4-Piston Monobloc Calipers"]'::jsonb,
        '{"length_mm": 4715, "width_mm": 1940, "height_mm": 1585, "wheelbase_mm": 3000, "curb_weight_kg": 2230, "battery_kwh": 84.0, "range_miles": 221}'::jsonb
    ) ON CONFLICT (vehicle_id, trim_name) DO NOTHING;

    -- 4. Ford F-150 Lightning (Electric Pickup Truck)
    INSERT INTO vehicles (id, make, model, year, body_type, category, price_range, hero_image_url, overview)
    VALUES (
        v_lightning_id,
        'Ford',
        'F-150 Lightning',
        2025,
        'Truck',
        'Electric',
        '$57,000 - $87,000',
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80',
        'The all-electric evolution of America’s best-selling pickup truck featuring standard 4x4, Mega Power Frunk, Pro Power Onboard generator capabilities, and up to 10,000 lbs towing capacity.'
    ) ON CONFLICT (make, model, year) DO NOTHING;

    INSERT INTO variants (vehicle_id, trim_name, price, engine_type, displacement_cc, horsepower_hp, torque_nm, transmission, drivetrain, fuel_type, fuel_economy, seating_capacity, safety_rating_ncap, key_features, dimensions)
    VALUES
    (
        v_lightning_id,
        'Flash Extended Range',
        69995.00,
        'Dual In-Board Electric Motors',
        NULL,
        580,
        1050,
        'Single-Speed Automatic Transaxle',
        'AWD',
        'Electric',
        '70 MPGe Combined',
        5,
        '5-Star',
        '["15.5-inch SYNC 4A Touchscreen", "Ford BlueCruise Hands-Free Highway Driving", "B&O Sound System", "9.6 kW Pro Power Onboard Outlet System", "Mega Power Frunk (400L / 400 lbs)"]'::jsonb,
        '{"length_mm": 5911, "width_mm": 2032, "height_mm": 1989, "wheelbase_mm": 3696, "curb_weight_kg": 2790, "battery_kwh": 131.0, "range_miles": 320, "towing_lbs": 8500}'::jsonb
    ),
    (
        v_lightning_id,
        'Platinum Extended Range',
        86995.00,
        'Dual In-Board Electric Motors High-Output',
        NULL,
        580,
        1050,
        'Single-Speed Automatic Transaxle',
        'AWD',
        'Electric',
        '66 MPGe Combined',
        5,
        '5-Star',
        '["Nirvana Leather Multicontour Seats with Active Motion", "Twin-Panel Panoramic Vista Roof", "Max Trailer Tow Package", "18-Speaker B&O Unleashed Sound System", "22-inch Bright Machined Aluminum Wheels"]'::jsonb,
        '{"length_mm": 5911, "width_mm": 2032, "height_mm": 1989, "wheelbase_mm": 3696, "curb_weight_kg": 3120, "battery_kwh": 131.0, "range_miles": 300, "towing_lbs": 8500}'::jsonb
    ) ON CONFLICT (vehicle_id, trim_name) DO NOTHING;

END $$;
