'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BedDouble, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Coffee, Leaf, MapPin, Menu, Phone, Sparkles, Trees, Users, Utensils, Waves, Wifi, X } from 'lucide-react';
import { localToday, roomTypes, reservationSchema } from '@/lib/reservations';

const bookingUrl = 'https://www.booking.com/hotel/vn/choose-hideaway-homestay.vi.html';
const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Choose+Hideaway+147+Nguyen+Hue+Ninh+Binh';
type Kind = 'room' | 'table';
type Room = {name: string; eyebrow: string; image: string; description: string; features: string[]};
const rooms: Room[] = [
  {name:'Queen nhìn ra vườn',eyebrow:'MỘT GÓC CHO RIÊNG MÌNH',image:'/images/booking-3.jpg',description:'Một lựa chọn riêng tư để nghỉ ngơi và bắt đầu hành trình khám phá Ninh Bình.',features:['Giường đôi','Điều hòa','Wi-Fi miễn phí']},
  {name:'Phòng gia đình',eyebrow:'CÙNG NHAU THẬT GẦN',image:'/images/booking-2.jpg',description:'Dành thời gian bên người thân trong không gian homestay giữa sân vườn xanh mát.',features:['Phòng tắm','Sân vườn','Điều hòa']},
  {name:'Giường tập thể',eyebrow:'CHO NHỮNG TÂM HỒN XÊ DỊCH',image:'/images/booking-0.jpg',description:'Một chỗ dừng chân giản dị cho chuyến đi cá nhân, cùng cơ hội gặp những người bạn mới.',features:['Giường tầng','Không gian chung','Wi-Fi miễn phí']},
];
const gallery = [
  {src:'/images/choose-pool.jpg',caption:'Hồ bơi & những chiếc đèn lồng'},
  {src:'/images/booking-2.jpg',caption:'Những căn phòng giữa sân vườn'},
  {src:'/images/choose-restaurant.jpg',caption:'Nhà hàng & quầy bar'},
  {src:'/images/booking-0.jpg',caption:'Không gian giường tập thể'},
  {src:'/images/booking-3.jpg',caption:'Một góc nghỉ ngơi'},
  {src:'/images/booking-1.jpg',caption:'Hideaway khi lên đèn'},
];
function nextDay(date: string) {const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
function Brand({light=false}: {light?:boolean}) {return <a href="#" className={`brand ${light?'brand-light':''}`} aria-label="Choose Hideaway — Trang chủ"><span className="brand-mark"><Leaf size={30} strokeWidth={1.3}/></span><span><strong>choose hideaway<span className="brand-dot">.</span></strong><small>HOMESTAY & RESTAURANT</small></span></a>;}

export default function Home() {
  const [kind,setKind]=useState<Kind>('room');
  const [mobileMenu,setMobileMenu]=useState(false);
  const [today,setToday]=useState('');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [guests,setGuests]=useState('2');
  const [time,setTime]=useState('18:30');
  const [selectedType,setSelectedType]=useState<string>('Cần tư vấn');
  const [selectedRoom,setSelectedRoom]=useState<Room|null>(null);
  const [lightbox,setLightbox]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [confirmation,setConfirmation]=useState<{id:string;kind:Kind;date:string;end:string;time:string;guests:string;name:string}|null>(null);
  const bookingRef=useRef<HTMLDialogElement>(null);
  const roomRef=useRef<HTMLDialogElement>(null);
  const galleryRef=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const t=localToday();setToday(t);setStart(t);setEnd(nextDay(t));},[]);
  function changeStart(value:string) {setStart(value);if(end<=value)setEnd(nextDay(value));}
  function openBooking(nextKind:Kind,roomType='Cần tư vấn') {setKind(nextKind);setSelectedType(roomType);setError('');setConfirmation(null);setMobileMenu(false);roomRef.current?.close();bookingRef.current?.showModal();}
  function openRoom(room:Room){setSelectedRoom(room);roomRef.current?.showModal();}
  function openGallery(index:number){setLightbox(index);galleryRef.current?.showModal();}
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;
    const data=new FormData(event.currentTarget);
    const payload={kind,name:String(data.get('name')||''),phone:String(data.get('phone')||''),email:String(data.get('email')||''),startDate:start,endDate:end,time,guests:Number(guests),rooms:Number(data.get('rooms')||1),roomType:selectedType,notes:String(data.get('notes')||''),consent:data.get('consent')==='on',website:String(data.get('website')||'')};
    const parsed=reservationSchema.safeParse(payload);
    if(!parsed.success){setError(parsed.error.issues[0]?.message||'Vui lòng kiểm tra thông tin.');return;}
    setBusy(true);setError('');
    try {const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json() as {id:string;error?:string};if(!response.ok)throw new Error(result.error||'Chưa gửi được yêu cầu.');setConfirmation({id:result.id,kind,date:start,end,time,guests,name:payload.name});}
    catch(e){setError(e instanceof Error?e.message:'Chưa gửi được yêu cầu. Vui lòng thử lại.');}
    finally{setBusy(false);}
  }
  return <>
    <a className="skip-link" href="#main">Đến nội dung chính</a>
    <header className="site-header"><div className="header-inner">
      <Brand/>
      <nav className={mobileMenu?'navigation is-open':'navigation'} aria-label="Điều hướng chính">
        {[['#ve-chung-toi','Về Hideaway'],['#homestay','Lưu trú'],['#nha-hang','Nhà hàng'],['#thu-vien','Khoảnh khắc'],['#lien-he','Liên hệ']].map(([href,label])=><a key={href} href={href} onClick={()=>setMobileMenu(false)}>{label}</a>)}
      </nav>
      <div className="header-actions"><a className="header-phone" href="tel:0913576663" aria-label="Gọi 0913 576 663"><Phone size={17}/></a><button className="button button-green header-book" onClick={()=>openBooking('room')}>Đặt chỗ <ArrowUpRight size={16}/></button><button className="menu-button" aria-label={mobileMenu?'Đóng menu':'Mở menu'} aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button></div>
    </div></header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-image" src="/images/choose-restaurant.jpg" alt="Nhà hàng Choose Hideaway với cây xanh, mái lá và đèn lồng" fetchPriority="high"/>
        <div className="hero-shade"/>
        <div className="hero-content container"><p className="eyebrow hero-eyebrow"><span/> YOUR LITTLE HIDEAWAY IN NINH BINH</p><h1 id="hero-title">Chậm lại một chút.<br/><em>Tận hưởng nhiều hơn.</em></h1><p className="hero-description">Một khoảng xanh, một bữa ăn ngon, một giấc ngủ yên.<br/>Chào mừng bạn về với Choose Hideaway.</p><div className="hero-buttons"><a className="button button-cream" href="#homestay">Khám phá homestay <ArrowUpRight size={18}/></a><button className="button button-outline" onClick={()=>openBooking('table')}>Đặt bàn nhà hàng <Utensils size={16}/></button></div></div>
        <div className="hero-bottom container"><span><MapPin size={15}/>147 Nguyễn Huệ, Ninh Bình</span><a href="#ve-chung-toi">CHẠM VÀO BÌNH YÊN <ArrowDown size={17}/></a><span className="hero-coordinate">STAY · DINE · UNWIND</span></div>
      </section>
      <section className="booking-widget container" aria-label="Đặt phòng hoặc đặt bàn">
        <div className="booking-tabs" role="group" aria-label="Loại đặt chỗ"><button className={kind==='room'?'active':''} aria-pressed={kind==='room'} onClick={()=>setKind('room')}><BedDouble size={18}/>Đặt phòng</button><button className={kind==='table'?'active':''} aria-pressed={kind==='table'} onClick={()=>setKind('table')}><Utensils size={17}/>Đặt bàn</button><span>Một chuyến đi đẹp bắt đầu từ đây.</span></div>
        <form className="quick-booking" onSubmit={e=>{e.preventDefault();openBooking(kind);}}>
          <label><span><CalendarDays size={16}/>{kind==='room'?'NGÀY NHẬN PHÒNG':'NGÀY DÙNG BỮA'}</span><input aria-label={kind==='room'?'Ngày nhận phòng':'Ngày dùng bữa'} type="date" required min={today} value={start} onChange={e=>changeStart(e.target.value)}/></label>
          {kind==='room'?<label><span><CalendarDays size={16}/>NGÀY TRẢ PHÒNG</span><input aria-label="Ngày trả phòng" type="date" required min={start?nextDay(start):today} value={end} onChange={e=>setEnd(e.target.value)}/></label>:<label><span><Clock3 size={16}/>GIỜ ĐẾN</span><input aria-label="Giờ đến" type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>}
          <label><span><Users size={16}/>SỐ KHÁCH</span><select aria-label="Số khách" value={guests} onChange={e=>setGuests(e.target.value)}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1} khách</option>)}</select></label>
          <button className="button button-green" type="submit">{kind==='room'?'Yêu cầu đặt phòng':'Yêu cầu đặt bàn'}<ArrowUpRight size={19}/></button>
        </form>
        <p className="booking-footnote">Choose Hideaway sẽ liên hệ xác nhận tình trạng chỗ và giá trước khi hoàn tất đặt chỗ.</p>
      </section>
      <section className="intro container" id="ve-chung-toi">
        <div className="intro-heading"><p className="eyebrow"><Leaf size={16}/> CHOOSE YOUR OWN PACE</p><h2>Không cần đi thật xa,<br/>chỉ cần <em>thấy thật khác.</em></h2></div><div className="intro-text"><p>Ẩn mình sau những tán cây tại 147 Nguyễn Huệ, Choose Hideaway là điểm dừng cho những ngày bạn muốn thảnh thơi ở Ninh Bình.</p><p>Ở lại trong một căn phòng ấm cúng, ngồi bên hồ bơi, rồi cùng nhau dùng bữa giữa không gian xanh. Những điều giản dị làm nên một chuyến đi đáng nhớ.</p><a className="text-link" href="#thu-vien">Một vòng quanh Hideaway <ArrowUpRight size={18}/></a></div>
      </section>
      <div className="amenities container"><span><Trees/>Sân vườn xanh mát</span><span><Waves/>Hồ bơi ngoài trời</span><span><Utensils/>Nhà hàng & quầy bar</span><span><Wifi/>Wi-Fi miễn phí</span></div>
      <section className="stay-section section-pad" id="homestay"><div className="container"><div className="section-heading"><div><p className="eyebrow">01 / STAY A LITTLE LONGER</p><h2>Một nơi để <em>ở lại.</em></h2></div><p>Chọn một góc nghỉ ngơi phù hợp.<br/>Để ngày mai bắt đầu thật nhẹ nhàng.</p></div>
        <div className="rooms-grid">{rooms.map((room,i)=><article className="room-card" key={room.name}><button className="room-image" onClick={()=>openRoom(room)} aria-label={`Xem ${room.name}`}><img src={room.image} alt={i===1?'Khu nhà lưu trú trong sân vườn Choose Hideaway':`Không gian lưu trú tại Choose Hideaway: ${room.name}`} loading="lazy"/><span>{String(i+1).padStart(2,'0')} / STAY</span><span className="image-arrow"><ArrowUpRight size={22}/></span></button><div className="room-content"><p className="eyebrow">{room.eyebrow}</p><h3>{room.name}</h3><p className="room-description">{room.description}</p><div className="room-features">{room.features.map(f=><span key={f}>{f}</span>)}</div><div className="room-bottom"><span>Liên hệ để nhận giá</span><button className="text-link" onClick={()=>openBooking('room',room.name)}>Đặt phòng <ArrowUpRight size={17}/></button></div></div></article>)}</div>
        <p className="room-source">Còn có phòng Deluxe nhìn ra vườn và hồ bơi. <a href={bookingUrl} target="_blank" rel="noopener noreferrer">Xem các loại phòng & giá theo ngày trên Booking.com <ArrowUpRight size={13}/></a></p>
      </div></section>
      <section className="dining-section" id="nha-hang"><div className="dining-image"><img src="/images/choose-pool.jpg" alt="Không gian nhà hàng mở bên hồ bơi và đèn lồng Choose Hideaway" loading="lazy"/><span className="photo-tag">GOOD FOOD. GOOD COMPANY.</span></div><div className="dining-content"><p className="eyebrow">02 / A SEAT AT OUR TABLE</p><h2>Hẹn nhau<br/>bên <em>bàn ăn.</em></h2><p>Những câu chuyện hay thường bắt đầu từ một bữa ăn. Nhà hàng không gian mở của Choose Hideaway mang hương vị Việt và quốc tế đến chiếc bàn giữa sân vườn.</p><div className="dining-options"><span><Utensils size={20}/>Ẩm thực Việt & quốc tế</span><span><Coffee size={20}/>Nhà hàng & quầy bar</span><span><Trees size={20}/>Không gian mở, gần thiên nhiên</span></div><button className="button button-cream" onClick={()=>openBooking('table')}>Giữ một bàn cho bạn <ArrowUpRight size={18}/></button><a className="dining-call" href="tel:0913576663">Tư vấn món ăn: 0913 576 663</a></div></section>
      <section className="gallery-section section-pad container" id="thu-vien"><div className="section-heading"><div><p className="eyebrow">03 / LITTLE MOMENTS, BIG MEMORIES</p><h2>Hideaway, <em>qua từng góc nhỏ.</em></h2></div><span className="gallery-hint"><Sparkles size={16}/>Ảnh thực tế tại Choose Hideaway</span></div><div className="gallery-grid">{gallery.slice(0,4).map((item,i)=><button key={item.src} className={`gallery-item gallery-item-${i}`} onClick={()=>openGallery(i)} aria-label={`Mở ảnh: ${item.caption}`}><img src={item.src} alt={item.caption} loading="lazy"/><span>{item.caption}<ArrowUpRight size={18}/></span></button>)}</div><button className="gallery-more text-link" onClick={()=>openGallery(4)}>Xem thêm khoảnh khắc <ArrowRight size={17}/></button></section>
      <section className="visit-section" id="lien-he"><div className="container visit-grid"><div><p className="eyebrow">04 / FIND YOUR HIDEAWAY</p><h2>Chúng tôi ở đây.<br/><em>Chờ bạn ghé.</em></h2><p>Một kỳ nghỉ ngắn hay một bữa tối bên nhau,<br/>luôn có một lý do để đến Hideaway.</p><div className="contact-row"><MapPin/><div><small>ĐỊA CHỈ</small><strong>147 Nguyễn Huệ, Ninh Bình</strong><a href={mapsUrl} target="_blank" rel="noopener noreferrer">Chỉ đường trên Google Maps <ArrowUpRight size={14}/></a></div></div><div className="contact-row"><Phone/><div><small>ĐẶT CHỖ & TƯ VẤN</small><a className="contact-phone" href="tel:0913576663">0913 576 663</a></div></div></div><div className="visit-photo"><img src="/images/choose-entrance.jpg" alt="Cổng Choose Hideaway tại 147 Nguyễn Huệ, Ninh Bình" loading="lazy"/><a href={mapsUrl} className="map-card" target="_blank" rel="noopener noreferrer"><span><MapPin size={22}/><span>Choose Hideaway<small>147 Nguyễn Huệ · Ninh Bình</small></span></span><ArrowUpRight size={21}/></a></div></div></section>
      <section className="faq-section container"><p className="eyebrow">TRƯỚC KHI BẠN GHÉ</p><div className="faq-grid"><details><summary>Đặt phòng trên website như thế nào?</summary><p>Chọn ngày, số khách và loại phòng rồi gửi yêu cầu. Yêu cầu được lưu ở trạng thái chờ xác nhận; Choose Hideaway sẽ liên hệ để báo giá và tình trạng phòng. Bạn cũng có thể xem giá và đặt qua <a href={bookingUrl} target="_blank" rel="noopener noreferrer">Booking.com</a>.</p></details><details><summary>Tôi có thể chỉ đến dùng bữa không?</summary><p>Bạn có thể gửi yêu cầu đặt bàn mà không cần đặt phòng. Hãy cho chúng tôi biết ngày, giờ đến, số khách và các lưu ý về ăn uống để nhà hàng liên hệ xác nhận.</p></details><details><summary>Tôi cần thanh toán trước không?</summary><p>Biểu mẫu này chưa thu tiền. Giá, phương thức thanh toán và điều kiện hủy sẽ được trao đổi khi Choose Hideaway xác nhận yêu cầu. Với đặt qua Booking.com, hãy xem chính sách của lựa chọn bạn đặt.</p></details><details><summary>Liên hệ nhanh với Choose Hideaway?</summary><p>Gọi <a href="tel:0913576663">0913 576 663</a> để hỏi về phòng, thực đơn, thời gian phục vụ hoặc thay đổi yêu cầu đặt chỗ.</p></details></div></section>
    </main>
    <footer><div className="container footer-top"><Brand light/><p>Stay a little. Feel a lot.</p><a href="#" className="back-top">Về đầu trang <ArrowUpRight size={17}/></a></div><div className="container footer-bottom"><span>© {today?today.slice(0,4):'2026'} Choose Hideaway. Homestay & Restaurant.</span><a href={bookingUrl} target="_blank" rel="noopener noreferrer">Thông tin lưu trú trên Booking.com <ArrowUpRight size={13}/></a></div></footer>
    <div className="mobile-booking"><button onClick={()=>openBooking('room')}><BedDouble size={18}/>Đặt phòng</button><button onClick={()=>openBooking('table')}><Utensils size={18}/>Đặt bàn</button><a href="tel:0913576663" aria-label="Gọi Choose Hideaway"><Phone size={18}/></a></div>

    <dialog ref={bookingRef} className="booking-dialog" onCancel={e=>{if(busy)e.preventDefault();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)bookingRef.current?.close();}} aria-labelledby="booking-title">
      <button className="dialog-close" aria-label="Đóng đặt chỗ" disabled={busy} onClick={()=>bookingRef.current?.close()}><X size={21}/></button>
      {confirmation?<div className="confirmation" role="status"><CheckCircle2 size={50}/><p className="eyebrow">HẸN GẶP BẠN Ở HIDEAWAY</p><h2 id="booking-title">Đã nhận yêu cầu!</h2><p>Cảm ơn {confirmation.name}. Yêu cầu {confirmation.kind==='room'?'đặt phòng':'đặt bàn'} của bạn đã được lưu và đang <strong>chờ xác nhận</strong>.</p><div className="confirmation-ticket"><small>MÃ YÊU CẦU</small><strong>{confirmation.id}</strong><span>{confirmation.date.split('-').reverse().join('/')} {confirmation.kind==='room'?`→ ${confirmation.end.split('-').reverse().join('/')}`:`· ${confirmation.time}`} · {confirmation.guests} khách</span></div><p>Để xác nhận giá và tình trạng chỗ ngay, hãy gọi <a href="tel:0913576663">0913 576 663</a> và cung cấp mã này.</p><button className="button button-green" onClick={()=>bookingRef.current?.close()}>Hoàn tất <Check size={18}/></button></div>:<>
        <p className="eyebrow">LET’S MAKE A LITTLE PLAN</p><h2 id="booking-title">{kind==='room'?'Một kỳ nghỉ dành cho bạn.':'Một bàn ăn dành cho bạn.'}</h2><p className="modal-intro">Điền thông tin để Choose Hideaway liên hệ xác nhận.</p>
        <div className="modal-tabs"><button className={kind==='room'?'active':''} onClick={()=>{setKind('room');setError('');}}><BedDouble size={17}/>Đặt phòng</button><button className={kind==='table'?'active':''} onClick={()=>{setKind('table');setError('');}}><Utensils size={17}/>Đặt bàn</button></div>
        <form onSubmit={submit} className="reservation-form"><div className="form-grid">
          <label>Họ và tên <span>*</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Tên của bạn"/></label><label>Số điện thoại <span>*</span><input name="phone" required type="tel" minLength={9} maxLength={22} autoComplete="tel" placeholder="0913 576 663"/></label>
          <label className="full">Email <small>(không bắt buộc)</small><input name="email" type="email" maxLength={200} autoComplete="email" placeholder="ban@email.com"/></label>
          <label>{kind==='room'?'Ngày nhận phòng':'Ngày dùng bữa'} <span>*</span><input type="date" required min={today} value={start} onChange={e=>changeStart(e.target.value)}/></label>
          {kind==='room'?<label>Ngày trả phòng <span>*</span><input type="date" required min={start?nextDay(start):today} value={end} onChange={e=>setEnd(e.target.value)}/></label>:<label>Giờ đến <span>*</span><input type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>}
          <label>Số khách <span>*</span><select value={guests} onChange={e=>setGuests(e.target.value)}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1} khách</option>)}</select></label>
          {kind==='room'&&<><label>Số phòng / giường <span>*</span><input name="rooms" type="number" min={1} max={10} defaultValue={1} required/></label><label className="full">Loại phòng <span>*</span><select value={selectedType} onChange={e=>setSelectedType(e.target.value)}>{roomTypes.map(r=><option key={r}>{r}</option>)}</select></label></>}
          <label className="full">{kind==='room'?'Lời nhắn cho chúng tôi':'Lưu ý về bàn & ăn uống'}<textarea name="notes" maxLength={1000} rows={2} placeholder={kind==='room'?'Giờ đến dự kiến, trẻ em, nhu cầu đặc biệt…':'Dị ứng thực phẩm, nhu cầu chỗ ngồi, có trẻ em…'}/></label>
        </div><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input type="checkbox" name="consent" required/><span>Tôi đồng ý để Choose Hideaway sử dụng thông tin đã cung cấp để liên hệ và xử lý yêu cầu đặt chỗ.</span></label><p className="form-note">Đây là yêu cầu đặt chỗ, chưa bảo đảm còn phòng/bàn. Giá và điều kiện sẽ được xác nhận khi liên hệ. Chưa thu tiền qua biểu mẫu.</p>{error&&<p role="alert" className="form-error">{error}</p>}<button type="submit" className="button button-green submit-button" disabled={busy}>{busy?'Đang gửi yêu cầu…':kind==='room'?'Gửi yêu cầu đặt phòng':'Gửi yêu cầu đặt bàn'}<ArrowUpRight size={18}/></button></form>
      </>}
    </dialog>
    <dialog ref={roomRef} className="room-dialog" aria-labelledby="room-dialog-title" onClick={e=>{if(e.target===e.currentTarget)roomRef.current?.close();}}><button className="dialog-close" onClick={()=>roomRef.current?.close()} aria-label="Đóng chi tiết phòng"><X/></button>{selectedRoom&&<><img className="detail-image" src={selectedRoom.image} alt={`Không gian Choose Hideaway — ${selectedRoom.name}`}/><div className="detail-content"><p className="eyebrow">YOUR STAY AT HIDEAWAY</p><h2 id="room-dialog-title">{selectedRoom.name}</h2><p>{selectedRoom.description}</p><div className="room-features">{selectedRoom.features.map(f=><span key={f}>{f}</span>)}</div><p className="form-note">Ảnh giới thiệu không gian lưu trú. Vui lòng liên hệ để xác nhận phòng cụ thể, số khách phù hợp và giá theo ngày.</p><button className="button button-green" onClick={()=>openBooking('room',selectedRoom.name)}>Yêu cầu đặt phòng <ArrowUpRight size={18}/></button></div></>}</dialog>
    <dialog ref={galleryRef} className="lightbox" aria-label="Thư viện ảnh Choose Hideaway" onKeyDown={e=>{if(e.key==='ArrowRight')setLightbox((lightbox+1)%gallery.length);if(e.key==='ArrowLeft')setLightbox((lightbox+gallery.length-1)%gallery.length);}} onClick={e=>{if(e.target===e.currentTarget)galleryRef.current?.close();}}><button className="dialog-close" aria-label="Đóng ảnh" onClick={()=>galleryRef.current?.close()}><X/></button><img src={gallery[lightbox].src} alt={gallery[lightbox].caption}/><div className="lightbox-controls"><button aria-label="Ảnh trước" onClick={()=>setLightbox((lightbox+gallery.length-1)%gallery.length)}><ChevronLeft/></button><p>{gallery[lightbox].caption}<small>{lightbox+1} / {gallery.length}</small></p><button aria-label="Ảnh tiếp theo" onClick={()=>setLightbox((lightbox+1)%gallery.length)}><ChevronRight/></button></div></dialog>
  </>;
}
