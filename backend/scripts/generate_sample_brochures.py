import os
import pymupdf as fitz


def create_taycan_brochure():
    os.makedirs("sample_brochures", exist_ok=True)
    pdf_path = os.path.join("sample_brochures", "2025_Porsche_Taycan_Brochure.pdf")
    doc = fitz.open()

    rect = fitz.Rect(50, 50, 550, 750)

    # Page 1: Overview & Design
    p1 = doc.new_page()
    text_p1 = """PORSCHE TAYCAN (2025 MODEL YEAR) - OFFICIAL TECHNICAL SPECIFICATION BROCHURE

Page 1: Overview and Aerodynamic Architecture
The new 2025 Porsche Taycan sets the benchmark for all-electric sports sedans. 
Engineered in Weissach and built in Zuffenhausen, the Taycan pairs classic Porsche styling with an ultra-low drag coefficient of 0.22 Cd. 
Featuring adaptive air curtains, active cooling air flaps, and an adaptive rear spoiler that extends in three distinct stages depending on speed, aerodynamic efficiency directly enhances highway driving range.

Key Design Highlights:
- Four-point LED matrix headlights with Porsche Dynamic Light System Plus (PDLS Plus).
- Seamless rear light band with glass-look PORSCHE lettering.
- Front luggage compartment (frunk) offering 84 liters of storage, paired with a 407-liter rear luggage trunk."""
    p1.insert_textbox(rect, text_p1, fontsize=11, fontname="helv")

    # Page 2: Powertrain & Acceleration
    p2 = doc.new_page()
    text_p2 = """PORSCHE TAYCAN (2025 MODEL YEAR) - OFFICIAL TECHNICAL SPECIFICATION BROCHURE

Page 2: Electric Propulsion, Overboost, and Performance Metrics
The Taycan platform utilizes high-efficiency Permanent Magnet Synchronous Motors (PSM) on both the front and rear axles.

Performance Metrics Across Trims:
1. Taycan Base (Rear-Wheel Drive):
   - Power Output: 402 hp (300 kW) with Launch Control Overboost.
   - Peak Torque: 410 Nm.
   - 0-60 mph Acceleration: 4.5 seconds.
   - Top Track Speed: 143 mph.

2. Taycan 4S (All-Wheel Drive):
   - Power Output: 536 hp (400 kW) with Performance Battery Plus.
   - Peak Torque: 695 Nm.
   - 0-60 mph Acceleration: 3.5 seconds.
   - Top Track Speed: 155 mph.

3. Taycan Turbo S (High-Performance Flagship):
   - Power Output: 938 hp (700 kW) maximum output during Launch Control.
   - Peak Torque: 1,110 Nm (818 lb-ft).
   - 0-60 mph Acceleration: 2.3 seconds.
   - Quarter-Mile Time: 9.9 seconds.
   - Top Track Speed: 161 mph.
   - Standard Porsche Ceramic Composite Brakes (PCCB) with 10-piston front calipers."""
    p2.insert_textbox(rect, text_p2, fontsize=11, fontname="helv")

    # Page 3: 800V Architecture & DC Fast Charging
    p3 = doc.new_page()
    text_p3 = """PORSCHE TAYCAN (2025 MODEL YEAR) - OFFICIAL TECHNICAL SPECIFICATION BROCHURE

Page 3: High-Voltage Battery System and DC Ultra-Fast Charging
At the core of the Taycan is Porsche's advanced 800-volt high-voltage electrical architecture, replacing the standard 400-volt industry design.

Battery Specifications:
- Standard Battery: 89.0 kWh gross energy capacity.
- Performance Battery Plus: 105.0 kWh gross (97.0 kWh usable net capacity) featuring nickel-manganese-cobalt (NMC) cathode chemistry.
- Maximum DC Charging Power: Up to 320 kW at 800V DC fast chargers.
- Fast Charging Time: Charges from 10% to 80% State of Charge (SoC) in just 18 minutes under optimal battery pre-conditioning.
- Thermal Management: Predictive Battery Cooling preheats or chills the cells based on navigation route and planned fast-charging stops."""
    p3.insert_textbox(rect, text_p3, fontsize=11, fontname="helv")

    # Page 4: Chassis, Suspension & Energy Recuperation
    p4 = doc.new_page()
    text_p4 = """PORSCHE TAYCAN (2025 MODEL YEAR) - OFFICIAL TECHNICAL SPECIFICATION BROCHURE

Page 4: Chassis Engineering and Recuperation Management
Chassis dynamics are governed by Porsche 4D Chassis Control, synchronizing active suspension components in real time.

Chassis Features:
- Adaptive Air Suspension with Porsche Active Suspension Management (PASM) is standard.
- Optional Porsche Active Ride: Active hydraulic dampers capable of instantly absorbing road undulations and tilting the vehicle into corners like a motorcycle.
- Brake Energy Recuperation: Generates up to 400 kW of recuperative electrical power during high-speed deceleration.
- Over 90% of everyday braking operations are accomplished purely via electric motor recuperation without engaging hydraulic friction pads."""
    p4.insert_textbox(rect, text_p4, fontsize=11, fontname="helv")

    doc.save(pdf_path)
    doc.close()
    print(f"Generated: {pdf_path}")


def create_bmw_brochure():
    os.makedirs("sample_brochures", exist_ok=True)
    pdf_path = os.path.join("sample_brochures", "2025_BMW_3_Series_Brochure.pdf")
    doc = fitz.open()

    rect = fitz.Rect(50, 50, 550, 750)

    p1 = doc.new_page()
    text_p1 = """BMW 3 SERIES SEDAN (2025 MODEL YEAR) - TECHNICAL PRODUCT GUIDE

Page 1: Architecture and Chassis Dynamics
The BMW 3 Series Sedan represents the definitive compact executive sports sedan.
Built upon BMW's CLAR (Cluster Architecture), the 3 Series maintains near-perfect 50:50 front-to-rear axle weight distribution.

Dimensions & Body:
- Length: 4,713 mm | Width: 1,827 mm | Height: 1,440 mm | Wheelbase: 2,851 mm.
- Curb Weight: 1,690 kg (330i xDrive) / 1,795 kg (M340i xDrive).
- Trunk Cargo Volume: 480 liters with 40/20/40 split-folding rear bench."""
    p1.insert_textbox(rect, text_p1, fontsize=11, fontname="helv")

    p2 = doc.new_page()
    text_p2 = """BMW 3 SERIES SEDAN (2025 MODEL YEAR) - TECHNICAL PRODUCT GUIDE

Page 2: TwinPower Turbo Powertrains and Efficiency
Engine Lineup Specifications:
1. BMW 330i xDrive:
   - Engine: 2.0-liter BMW TwinPower Turbo 4-cylinder gasoline with High Precision Direct Injection and VALVETRONIC.
   - Horsepower: 255 hp @ 5,000 - 6,500 rpm.
   - Torque: 400 Nm (295 lb-ft) @ 1,550 - 4,400 rpm.
   - Transmission: 8-speed Steptronic Sport Automatic.
   - Fuel Economy: 24 MPG City / 33 MPG Highway.

2. BMW M340i xDrive:
   - Engine: 3.0-liter BMW M TwinPower Turbo inline 6-cylinder with 48V Mild Hybrid Starter-Generator.
   - Horsepower: 386 hp @ 5,800 - 6,500 rpm.
   - Torque: 540 Nm (398 lb-ft) @ 1,800 - 5,000 rpm.
   - 0-60 mph Acceleration: 4.1 seconds.
   - Standard M Sport Differential with electro-mechanical multi-plate lock."""
    p2.insert_textbox(rect, text_p2, fontsize=11, fontname="helv")

    doc.save(pdf_path)
    doc.close()
    print(f"Generated: {pdf_path}")


if __name__ == "__main__":
    create_taycan_brochure()
    create_bmw_brochure()
