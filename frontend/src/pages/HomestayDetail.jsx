import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, Wifi, Wind, Check, X, QrCode } from 'lucide-react';

const HomestayDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [homestay, setHomestay] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Booking Modal State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        guestName: user?.name || '',
        guestPhone: '',
        checkInDate: '',
        checkOutDate: '',
        paymentMethod: 'UPI', // UPI, CARD, or CASH
        utrNumber: ''
    });

    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        nameOnCard: ''
    });

    useEffect(() => {
        fetchHomestayDetails();
    }, [id]);

    const fetchHomestayDetails = async () => {
        setLoading(true);
        try {
            const hsRes = await axios.get(`http://localhost:8080/api/homestays/${id}`);
            setHomestay(hsRes.data);

            const reqRes = await axios.get(`http://localhost:8080/api/reviews/homestay/${id}`);
            setReviews(reqRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookRoom = (room) => {
        if (!user || user.role !== 'GUEST') {
            alert("Please login as a Guest to book a room");
            return;
        }
        setSelectedRoom(room);
        setShowBookingModal(true);
    };

    const calculateTotalAmount = () => {
        if (!selectedRoom) return 0;
        if (!bookingForm.checkInDate || !bookingForm.checkOutDate) return selectedRoom.price;
        const start = new Date(bookingForm.checkInDate);
        const end = new Date(bookingForm.checkOutDate);
        const diffTime = end.getTime() - start.getTime();
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) diffDays = 1;
        return selectedRoom.price * diffDays;
    };

    const confirmBooking = async (e) => {
        e.preventDefault();

        if (new Date(bookingForm.checkInDate) >= new Date(bookingForm.checkOutDate)) {
            alert("Check-out date must be after check-in date.");
            return;
        }

        if (bookingForm.paymentMethod === 'UPI') {
            if (!bookingForm.utrNumber || bookingForm.utrNumber.trim().length !== 12) {
                alert("Please complete the UPI payment and enter the valid 12-digit UTR/Reference number to confirm your booking.");
                return;
            }
        } else if (bookingForm.paymentMethod === 'CARD') {
            if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\D/g, '').length < 15) {
                alert("Please enter a valid card number.");
                return;
            }
            if (!cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.nameOnCard) {
                alert("Please fill in all card details.");
                return;
            }
            // Mock card processing time
            alert("Processing Card Payment...");
        }

        try {
            await axios.post('http://localhost:8080/api/bookings', {
                homestayId: homestay.id,
                homestayName: homestay.name,
                roomId: selectedRoom.id,
                guestEmail: user.email,
                guestName: bookingForm.guestName,
                guestPhone: bookingForm.guestPhone,
                checkInDate: bookingForm.checkInDate,
                checkOutDate: bookingForm.checkOutDate,
                paymentMethod: bookingForm.paymentMethod
            });
            setShowBookingModal(false);
            alert("Booking Confirmed! View it in 'Our Bookings'");
            navigate('/bookings');
        } catch (error) {
            console.error(error);
            alert("Failed to book room");
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading details...</div>;
    if (!homestay) return <div className="container" style={{ padding: '2rem' }}>Homestay not found.</div>;

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <div className="card animate-fade-in" style={{ marginBottom: '3rem', overflow: 'hidden' }}>
                <img src={homestay.photoUrl} alt={homestay.name} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
                <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{homestay.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: '#fbbf24', fontWeight: 'bold' }}>
                            <Star fill="#fbbf24" /> {homestay.averageRating > 0 ? homestay.averageRating.toFixed(1) : 'New'}
                        </div>
                    </div>
                    {homestay.address && <p style={{ fontSize: '1.2rem', color: 'var(--gray)', marginBottom: '1rem' }}>{homestay.address}</p>}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(homestay.locationMapUrl)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', color: 'var(--gray)', textDecoration: 'none', marginBottom: '1.5rem' }}>
                        <MapPin /> {homestay.locationMapUrl}
                    </a>
                    <a href={`https://www.google.com/maps/search/tourist+attractions+near+${encodeURIComponent(homestay.locationMapUrl)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <MapPin size={18} /> View Nearby Tourist Attractions
                    </a>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Available Rooms</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {homestay.rooms.length === 0 && <p>No rooms currently available.</p>}
                        {homestay.rooms.map((room, idx) => (
                            <div key={room.id} className="card" style={{ display: 'flex', overflow: 'hidden' }}>
                                <img src={room.photoUrl} alt="Room" style={{ width: '200px', objectFit: 'cover' }} />
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Room {idx + 1} ({room.numberOfBeds} Beds)</h3>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'var(--gray)' }}>
                                        {room.isAc && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Wind size={16} /> AC</span>}
                                        {room.hasWifi && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Wifi size={16} /> Wi-Fi</span>}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{room.otherFeatures}</p>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{room.price}<span style={{ fontSize: '1rem', color: 'var(--gray)' }}>/night</span></span>
                                        <button className="btn btn-primary" onClick={() => handleBookRoom(room)}>Book This Room</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Guest Reviews</h2>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        {reviews.length === 0 ? (
                            <p style={{ color: 'var(--gray)' }}>No reviews yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {reviews.map(review => (
                                    <div key={review.id} style={{ borderBottom: '1px solid var(--gray-light)', paddingBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <strong>{review.guestName}</strong>
                                            <div style={{ display: 'flex', color: '#fbbf24' }}><Star size={14} fill="#fbbf24" /> {review.rating}</div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in p-6" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Book Room in {homestay.name}</h2>
                            <button onClick={() => setShowBookingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ margin: 0, fontSize: '1.1rem' }}>Total Price: <strong>₹{calculateTotalAmount()}</strong></p>
                            {bookingForm.checkInDate && bookingForm.checkOutDate && (
                                <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--gray)' }}>
                                    ₹{selectedRoom?.price} × {Math.max(1, Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24)))} night(s)
                                </p>
                            )}
                        </div>

                        <form onSubmit={confirmBooking}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input required className="input-field" value={bookingForm.guestName} onChange={e => setBookingForm({ ...bookingForm, guestName: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Phone Number</label>
                                <input required type="tel" className="input-field" value={bookingForm.guestPhone} onChange={e => setBookingForm({ ...bookingForm, guestPhone: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <input disabled className="input-field" value={user.email} style={{ backgroundColor: 'var(--gray-light)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label">Check-in Date</label>
                                    <input required type="date" min={new Date().toISOString().split('T')[0]} className="input-field" value={bookingForm.checkInDate} onChange={e => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label">Check-out Date</label>
                                    <input required type="date" min={bookingForm.checkInDate || new Date().toISOString().split('T')[0]} className="input-field" value={bookingForm.checkOutDate} onChange={e => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Payment Method</label>
                                <select className="input-field" value={bookingForm.paymentMethod} onChange={e => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}>
                                    <option value="UPI">Online Payment (UPI/Apps)</option>
                                    <option value="CARD">Credit/Debit Card</option>
                                    <option value="CASH">Cash on Arrival</option>
                                </select>
                            </div>

                            {bookingForm.paymentMethod === 'UPI' && (
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f0f4f8', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>

                                    {/* Direct App Links */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>Pay Directly Using Apps</p>
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <a href={`tez://upi/pay?pa=shreyasdr.gowda25@oksbi&pn=Shreyas%20DR&cu=INR&am=${calculateTotalAmount()}`} onClick={(e) => {
                                                // If on desktop, this link won't do anything, so we simulate the flow for testing
                                                e.preventDefault();
                                                alert("Simulating redirect to Google Pay...");
                                                setTimeout(() => {
                                                    setBookingForm({ ...bookingForm, utrNumber: '123456789012' });
                                                    alert("Test Payment Successful! UTR has been auto-filled.");
                                                }, 1000);
                                            }} className="btn" style={{ background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flex: 1, minWidth: '120px', justifyContent: 'center', textDecoration: 'none' }}>
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" style={{ height: '18px' }} /> GPay
                                            </a>
                                            <a href={`phonepe://pay?pa=shreyasdr.gowda25@oksbi&pn=Shreyas%20DR&cu=INR&am=${calculateTotalAmount()}`} onClick={(e) => {
                                                // Simulate for testing
                                                e.preventDefault();
                                                alert("Simulating redirect to PhonePe...");
                                                setTimeout(() => {
                                                    setBookingForm({ ...bookingForm, utrNumber: '987654321098' });
                                                    alert("Test Payment Successful! UTR has been auto-filled.");
                                                }, 1000);
                                            }} className="btn" style={{ background: '#fff', color: '#5f259f', border: '1px solid #ddd', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flex: 1, minWidth: '120px', justifyContent: 'center', textDecoration: 'none' }}>
                                                <h4 style={{ margin: 0, color: '#5f259f' }}>PhonePe</h4>
                                            </a>
                                        </div>
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>(Clicking these buttons will simulate a payment for testing)</p>
                                    </div>

                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
                                        <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>OR SCAN QR</span>
                                        <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
                                    </div>

                                    {/* Scanner Recreated from Image */}
                                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', margin: '0 auto', maxWidth: '300px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#65a30d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>S</div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: '500', color: '#1f2937' }}>Shreyas DR</span>
                                        </div>

                                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dshreyasdr.gowda25%40oksbi%26pn%3DShreyas%2520DR%26cu%3DINR%26am%3D${calculateTotalAmount()}`}
                                                alt="UPI QR Code"
                                                style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block' }}
                                            />
                                            {/* Center Google Pay Logo over QR */}
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: '50%', padding: '6px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" style={{ width: '24px' }} />
                                            </div>
                                        </div>

                                        {/* AMOUNT ADDED TO SCANNER */}
                                        <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Amount Payable</span>
                                            <h2 style={{ margin: '0.25rem 0 0 0', color: '#b45309', fontSize: '1.8rem' }}>₹{calculateTotalAmount()}</h2>
                                        </div>

                                        <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: '#4b5563', letterSpacing: '0.02em' }}>UPI ID: shreyasdr.gowda25@oksbi</p>
                                    </div>
                                    <p style={{ marginTop: '1.5rem', fontSize: '1rem', color: '#4b5563', fontWeight: '500' }}>Scan the QR code with any UPI app to pay</p>

                                    <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem' }}>
                                        <label className="input-label" style={{ color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <Check size={18} /> Confirm Payment
                                        </label>
                                        <input
                                            required={bookingForm.paymentMethod === 'UPI'}
                                            type="text"
                                            minLength={12}
                                            maxLength={12}
                                            placeholder="Enter 12-Digit UTR/Reference No."
                                            className="input-field"
                                            value={bookingForm.utrNumber}
                                            onChange={e => setBookingForm({ ...bookingForm, utrNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                                            style={{ borderColor: '#22c55e', backgroundColor: '#f0fdf4' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {bookingForm.paymentMethod === 'CARD' && (
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Enter Card Details</h3>
                                    <div className="input-group">
                                        <label className="input-label">Card Number</label>
                                        <input required={bookingForm.paymentMethod === 'CARD'} type="text" placeholder="0000 0000 0000 0000" maxLength="19" className="input-field" value={cardDetails.cardNumber} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            val = val.replace(/(\d{4})/g, '$1 ').trim();
                                            setCardDetails({ ...cardDetails, cardNumber: val });
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label">Expiry Date</label>
                                            <input required={bookingForm.paymentMethod === 'CARD'} type="text" placeholder="MM/YY" maxLength="5" className="input-field" value={cardDetails.expiryDate} onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
                                                setCardDetails({ ...cardDetails, expiryDate: val });
                                            }} />
                                        </div>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label">CVV</label>
                                            <input required={bookingForm.paymentMethod === 'CARD'} type="password" placeholder="•••" maxLength="4" className="input-field" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="input-label">Name on Card</label>
                                        <input required={bookingForm.paymentMethod === 'CARD'} type="text" placeholder="John Doe" className="input-field" value={cardDetails.nameOnCard} onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Pay ₹{calculateTotalAmount()} & Confirm Booking</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomestayDetail;
