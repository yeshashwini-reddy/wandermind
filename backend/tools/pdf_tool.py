import os
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime

PDF_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_pdfs")
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)

def generate_booking_receipt_pdf(booking_data: dict) -> str:
    """
    Generates a PDF booking receipt using ReportLab with styling, QR code, and breakdown.
    Returns the file path.
    """
    booking_id = booking_data.get("booking_id", "WM-BK-999")
    pdf_filename = f"receipt_{booking_id}.pdf"
    file_path = os.path.join(PDF_OUTPUT_DIR, pdf_filename)
    
    # Generate QR Code image in memory
    qr = qrcode.QRCode(box_size=4, border=2)
    qr_data = f"WanderMind-Verified-Booking:{booking_id}|Passenger:{booking_data.get('passenger_name')}|Paid:Rs.{booking_data.get('total_paid')}"
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0f172a", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#f97316') # Sunset Orange
    )
    
    subhead_style = ParagraphStyle(
        'DocSubhead',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569')
    )
    
    title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a')
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    
    badge_style = ParagraphStyle(
        'SimulatedBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0d9488')
    )
    
    elements = []
    
    # Header Banner
    header_table_data = [
        [
            Paragraph("<b>WANDERMIND</b><br/><font size=10 color='#64748b'>Autonomous AI Trip Orchestration Platform</font>", header_style),
            Paragraph("<b>OFFICIAL E-RECEIPT</b><br/><font size=9 color='#0d9488'>STATUS: CONFIRMED (SIMULATED)</font>", ParagraphStyle('RAlign', parent=body_style, alignment=2))
        ]
    ]
    t_head = Table(header_table_data, colWidths=[300, 230])
    t_head.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    elements.append(t_head)
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#f97316'), spaceAfter=15))
    
    # Passenger and Trip Meta Table
    trans_info = booking_data.get("transport_details", {})
    stay_info = booking_data.get("stay_details", {})
    
    meta_data = [
        [Paragraph("<b>Booking ID:</b>", body_style), Paragraph(f"<code>{booking_id}</code>", body_style),
         Paragraph("<b>Date of Issue:</b>", body_style), Paragraph(str(booking_data.get("booking_date", datetime.now().strftime("%d %b %Y, %H:%M"))), body_style)],
        [Paragraph("<b>Lead Passenger:</b>", body_style), Paragraph(str(booking_data.get("passenger_name", "Rajesh Sharma")), body_style),
         Paragraph("<b>Destination:</b>", body_style), Paragraph(str(booking_data.get("destination_name", "Goa, India")), body_style)],
        [Paragraph("<b>Contact Phone:</b>", body_style), Paragraph(str(booking_data.get("passenger_phone", "+91 98765 43210")), body_style),
         Paragraph("<b>Total Travelers:</b>", body_style), Paragraph(f"{booking_data.get('passengers_count', 4)} Persons", body_style)],
        [Paragraph("<b>Contact Email:</b>", body_style), Paragraph(str(booking_data.get("passenger_email", "rajesh.sharma@example.com")), body_style),
         Paragraph("<b>Payment Mode:</b>", body_style), Paragraph("Simulated Instant UPI", badge_style)]
    ]
    t_meta = Table(meta_data, colWidths=[110, 155, 110, 155])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_meta)
    elements.append(Spacer(1, 15))
    
    # Line Items Breakdown Table
    elements.append(Paragraph("<b>Confirmed Travel & Accommodation Itinerary</b>", title_style))
    elements.append(Spacer(1, 8))
    
    trans_cost = trans_info.get("price", 7400.0)
    stay_cost = stay_info.get("price", 6800.0)
    service_fee = 250.0
    gst = (trans_cost + stay_cost) * 0.05
    total_paid = booking_data.get("total_paid", trans_cost + stay_cost + service_fee + gst)
    
    line_items = [
        [Paragraph("<b>Item Description</b>", body_style), Paragraph("<b>Provider & Tier</b>", body_style), Paragraph("<b>Policy</b>", body_style), Paragraph("<b>Amount (INR)</b>", body_style)],
        [
            Paragraph(f"<b>Transport:</b> {trans_info.get('title', 'Superfast Express')}", body_style),
            Paragraph(f"{trans_info.get('provider', 'IRCTC')} ({trans_info.get('badge', 'Best Value')})", body_style),
            Paragraph("Refundable", badge_style),
            Paragraph(f"₹ {trans_cost:,.2f}", body_style)
        ],
        [
            Paragraph(f"<b>Stay:</b> {stay_info.get('title', 'Resort Candolim')}", body_style),
            Paragraph(f"{stay_info.get('duration_or_tier', '2 Nights')}", body_style),
            Paragraph("Free Cancel 48h", badge_style),
            Paragraph(f"₹ {stay_cost:,.2f}", body_style)
        ],
        [
            Paragraph("WanderMind Multi-Agent Concierge & Real-time Replanning Guarantee", body_style),
            Paragraph("AI Autonomous Plan B Support", body_style),
            Paragraph("Active", badge_style),
            Paragraph(f"₹ {service_fee:,.2f}", body_style)
        ],
        [
            Paragraph("Applicable Taxes (GST 5%)", body_style),
            Paragraph("Government Statutory Levy", body_style),
            Paragraph("-", body_style),
            Paragraph(f"₹ {gst:,.2f}", body_style)
        ],
        [
            Paragraph("<b>TOTAL AMOUNT PAID</b>", title_style),
            Paragraph("<b>ALL INCLUSIVE</b>", title_style),
            Paragraph("<b>CONFIRMED</b>", badge_style),
            Paragraph(f"<b>₹ {total_paid:,.2f}</b>", ParagraphStyle('TotalStyle', parent=title_style, textColor=colors.HexColor('#ea580c')))
        ]
    ]
    
    t_items = Table(line_items, colWidths=[200, 130, 90, 110])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#fff7ed')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 15))
    
    # Bottom Guarantee & QR Code
    qr_flowable = Image(qr_buffer, width=1.1*inch, height=1.1*inch)
    bottom_data = [
        [
            Paragraph(
                "<b>WanderMind Real-Time Replan Guarantee:</b><br/>"
                "• Your itinerary is monitored 24/7 by WanderMind's Replanner Agent.<br/>"
                "• If weather alerts, rail delays, or closures occur, your live itinerary auto-adapts.<br/>"
                "• Access your live itinerary anytime by scanning this QR or visiting your trip link.<br/>"
                "<font color='#0d9488'><b>Simulated Booking - For Academic & Evaluation Demonstration Only.</b></font>",
                subhead_style
            ),
            qr_flowable
        ]
    ]
    t_bottom = Table(bottom_data, colWidths=[410, 120])
    t_bottom.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdfa')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#99f6e4')),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    elements.append(t_bottom)
    
    doc.build(elements)
    return file_path
