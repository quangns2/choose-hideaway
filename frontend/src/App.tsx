import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BedDouble, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Coffee, Leaf, MapPin, Menu, Phone, Sparkles, Trees, Users, Utensils, Waves, Wifi, X } from 'lucide-react';
import { localToday, reservationSchema } from '@choose-hideaway/contracts';
import { LanguageSwitcher, useLanguage, validationMessage } from './i18n';
import RoomPicker from './RoomPicker';

const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Choose+Hideaway+147+Nguyen+Hue+Ninh+Binh';
const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
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
function Brand({light=false}: {light?:boolean}) {const {t}=useLanguage();return <a href="#" className={`brand ${light?'brand-light':''}`} aria-label={t("Choose Hideaway — Trang chủ")}><span className="brand-mark"><Leaf size={30} strokeWidth={1.3}/></span><span><strong>choose hideaway<span className="brand-dot">.</span></strong><small>{t("HOMESTAY & RESTAURANT")}</small></span></a>;}

export default function App() {
  const {t,formatDate,language}=useLanguage();
  const bookingUrl = `https://www.booking.com/hotel/vn/choose-hideaway-homestay.${language==='en'?'en-gb':'vi'}.html`;
  const [kind,setKind]=useState<Kind>('room');
  const [mobileMenu,setMobileMenu]=useState(false);
  const [today,setToday]=useState('');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [guests,setGuests]=useState('2');
  const [time,setTime]=useState('18:30');
  const [selectedType,setSelectedType]=useState<string>('Cần tư vấn');
  const [roomChoicesExpanded,setRoomChoicesExpanded]=useState(true);
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
  function openBooking(nextKind:Kind,roomType='Cần tư vấn') {setKind(nextKind);setSelectedType(roomType);setRoomChoicesExpanded(roomType==='Cần tư vấn');setError('');setConfirmation(null);setMobileMenu(false);roomRef.current?.close();bookingRef.current?.showModal();}
  function openRoom(room:Room){setSelectedRoom(room);roomRef.current?.showModal();}
  function openGallery(index:number){setLightbox(index);galleryRef.current?.showModal();}
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;
    const data=new FormData(event.currentTarget);
    const payload={kind,name:String(data.get('name')||''),phone:String(data.get('phone')||''),email:String(data.get('email')||''),startDate:start,endDate:end,time,guests:Number(guests),rooms:Number(data.get('rooms')||1),roomType:selectedType,notes:String(data.get('notes')||''),consent:data.get('consent')==='on',website:String(data.get('website')||'')};
    const parsed=reservationSchema.safeParse(payload);
    if(!parsed.success){setError(validationMessage(parsed.error.issues[0]));return;}
    setBusy(true);setError('');
    try {const response=await fetch(`${apiUrl}/api/reservations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json() as {id:string;error?:string};if(!response.ok)throw new Error(result.error||'Chưa gửi được yêu cầu.');setConfirmation({id:result.id,kind,date:start,end,time,guests,name:payload.name});}
    catch(e){setError(e instanceof Error&&!(e instanceof TypeError)?e.message:'Chưa gửi được yêu cầu. Vui lòng thử lại.');}
    finally{setBusy(false);}
  }
  return <>
    <a className="skip-link" href="#main">{t("Đến nội dung chính")}</a>
    <header className="site-header"><div className="header-inner">
      <Brand/>
      <nav className={mobileMenu?'navigation is-open':'navigation'} aria-label={t("Điều hướng chính")}>
        {[['#ve-chung-toi',t("Về Hideaway")],['#homestay',t("Lưu trú")],['#nha-hang',t("Nhà hàng")],['#thu-vien',t("Khoảnh khắc")],['#lien-he',t("Liên hệ")]].map(([href,label])=><a key={href} href={href} onClick={()=>setMobileMenu(false)}>{label}</a>)}
      </nav>
      <div className="header-actions"><LanguageSwitcher/><a className="header-phone" href="tel:0913576663" aria-label={t("Gọi 0913 576 663")}><Phone size={17}/></a><button className="button button-green header-book" onClick={()=>openBooking('room')}>{t("Đặt chỗ ")}<ArrowUpRight size={16}/></button><button className="menu-button" aria-label={mobileMenu?t("Đóng menu"):t("Mở menu")} aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button></div>
    </div></header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-image" src="/images/choose-restaurant.jpg" alt={t("Nhà hàng Choose Hideaway với cây xanh, mái lá và đèn lồng")} fetchPriority="high"/>
        <div className="hero-shade"/>
        <div className="hero-content container"><p className="eyebrow hero-eyebrow"><span/>{t(" YOUR LITTLE HIDEAWAY IN NINH BINH")}</p><h1 id="hero-title">{t("Chậm lại một chút.")}<br/><em>{t("Tận hưởng nhiều hơn.")}</em></h1><p className="hero-description">{t("Một khoảng xanh, một bữa ăn ngon, một giấc ngủ yên.")}<br/>{t("Chào mừng bạn về với Choose Hideaway.")}</p><div className="hero-buttons"><a className="button button-cream" href="#homestay">{t("Khám phá homestay ")}<ArrowUpRight size={18}/></a><button className="button button-outline" onClick={()=>openBooking('table')}>{t("Đặt bàn nhà hàng ")}<Utensils size={16}/></button></div></div>
        <div className="hero-bottom container"><span><MapPin size={15}/>147 Nguyễn Huệ, Ninh Bình</span><a href="#ve-chung-toi">{t("CHẠM VÀO BÌNH YÊN ")}<ArrowDown size={17}/></a><span className="hero-coordinate">{t("STAY · DINE · UNWIND")}</span></div>
      </section>
      <section className="booking-widget container" aria-label={t("Đặt phòng hoặc đặt bàn")}>
        <div className="booking-tabs" role="group" aria-label={t("Loại đặt chỗ")}><button className={kind==='room'?'active':''} aria-pressed={kind==='room'} onClick={()=>setKind('room')}><BedDouble size={18}/>{t("Đặt phòng")}</button><button className={kind==='table'?'active':''} aria-pressed={kind==='table'} onClick={()=>setKind('table')}><Utensils size={17}/>{t("Đặt bàn")}</button><span>{t("Một chuyến đi đẹp bắt đầu từ đây.")}</span></div>
        <form className="quick-booking" onSubmit={e=>{e.preventDefault();openBooking(kind);}}>
          <label><span><CalendarDays size={16}/>{kind==='room'?t("NGÀY NHẬN PHÒNG"):t("NGÀY DÙNG BỮA")}</span><input aria-label={kind==='room'?t("Ngày nhận phòng"):t("Ngày dùng bữa")} type="date" required min={today} value={start} onChange={e=>changeStart(e.target.value)}/></label>
          {kind==='room'?<label><span><CalendarDays size={16}/>{t("NGÀY TRẢ PHÒNG")}</span><input aria-label={t("Ngày trả phòng")} type="date" required min={start?nextDay(start):today} value={end} onChange={e=>setEnd(e.target.value)}/></label>:<label><span><Clock3 size={16}/>{t("GIỜ ĐẾN")}</span><input aria-label={t("Giờ đến")} type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>}
          <label><span><Users size={16}/>{t("SỐ KHÁCH")}</span><select aria-label={t("Số khách")} value={guests} onChange={e=>setGuests(e.target.value)}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1}{t(" khách")}</option>)}</select></label>
          <button className="button button-green" type="submit">{kind==='room'?t("Yêu cầu đặt phòng"):t("Yêu cầu đặt bàn")}<ArrowUpRight size={19}/></button>
        </form>
        <p className="booking-footnote">{t("Choose Hideaway sẽ liên hệ xác nhận tình trạng chỗ và giá trước khi hoàn tất đặt chỗ.")}</p>
      </section>
      <section className="intro container" id="ve-chung-toi">
        <div className="intro-heading"><p className="eyebrow"><Leaf size={16}/>{t(" CHOOSE YOUR OWN PACE")}</p><h2>{t("Không cần đi thật xa,")}<br/>{t("chỉ cần ")}<em>{t("thấy thật khác.")}</em></h2></div><div className="intro-text"><p>{t("Ẩn mình sau những tán cây tại 147 Nguyễn Huệ, Choose Hideaway là điểm dừng cho những ngày bạn muốn thảnh thơi ở Ninh Bình.")}</p><p>{t("Ở lại trong một căn phòng ấm cúng, ngồi bên hồ bơi, rồi cùng nhau dùng bữa giữa không gian xanh. Những điều giản dị làm nên một chuyến đi đáng nhớ.")}</p><a className="text-link" href="#thu-vien">{t("Một vòng quanh Hideaway ")}<ArrowUpRight size={18}/></a></div>
      </section>
      <div className="amenities container"><span><Trees/>{t("Sân vườn xanh mát")}</span><span><Waves/>{t("Hồ bơi ngoài trời")}</span><span><Utensils/>{t("Nhà hàng & quầy bar")}</span><span><Wifi/>{t("Wi-Fi miễn phí")}</span></div>
      <section className="stay-section section-pad" id="homestay"><div className="container"><div className="section-heading"><div><p className="eyebrow">{t("01 / STAY A LITTLE LONGER")}</p><h2>{t("Một nơi để ")}<em>{t("ở lại.")}</em></h2></div><p>{t("Chọn một góc nghỉ ngơi phù hợp.")}<br/>{t("Để ngày mai bắt đầu thật nhẹ nhàng.")}</p></div>
        <div className="rooms-grid">{rooms.map((room,i)=><article className="room-card" key={room.name}><button className="room-image" onClick={()=>openRoom(room)} aria-label={t("Xem {room}",{room:t(room.name)})}><img src={room.image} alt={i===1?t("Khu nhà lưu trú trong sân vườn Choose Hideaway"):t("Không gian lưu trú tại Choose Hideaway: {room}",{room:t(room.name)})} loading="lazy"/><span>{String(i+1).padStart(2,'0')}{t(" / STAY")}</span><span className="image-arrow"><ArrowUpRight size={22}/></span></button><div className="room-content"><p className="eyebrow">{t(room.eyebrow)}</p><h3>{t(room.name)}</h3><p className="room-description">{t(room.description)}</p><div className="room-features">{room.features.map(f=><span key={f}>{t(f)}</span>)}</div><div className="room-bottom"><span>{t("Liên hệ để nhận giá")}</span><button className="text-link" onClick={()=>openBooking('room',room.name)}>{t("Đặt phòng ")}<ArrowUpRight size={17}/></button></div></div></article>)}</div>
        <p className="room-source">{t("Còn có phòng Deluxe nhìn ra vườn và hồ bơi. ")}<a href={bookingUrl} target="_blank" rel="noopener noreferrer">{t("Xem các loại phòng & giá theo ngày trên Booking.com ")}<ArrowUpRight size={13}/></a></p>
      </div></section>
      <section className="dining-section" id="nha-hang"><div className="dining-image"><img src="/images/choose-pool.jpg" alt={t("Không gian nhà hàng mở bên hồ bơi và đèn lồng Choose Hideaway")} loading="lazy"/><span className="photo-tag">{t("GOOD FOOD. GOOD COMPANY.")}</span></div><div className="dining-content"><p className="eyebrow">{t("02 / A SEAT AT OUR TABLE")}</p><h2>{t("Hẹn nhau")}<br/>{t("bên ")}<em>{t("bàn ăn.")}</em></h2><p>{t("Những câu chuyện hay thường bắt đầu từ một bữa ăn. Nhà hàng không gian mở của Choose Hideaway mang hương vị Việt và quốc tế đến chiếc bàn giữa sân vườn.")}</p><div className="dining-options"><span><Utensils size={20}/>{t("Ẩm thực Việt & quốc tế")}</span><span><Coffee size={20}/>{t("Nhà hàng & quầy bar")}</span><span><Trees size={20}/>{t("Không gian mở, gần thiên nhiên")}</span></div><button className="button button-cream" onClick={()=>openBooking('table')}>{t("Giữ một bàn cho bạn ")}<ArrowUpRight size={18}/></button><a className="dining-call" href="tel:0913576663">{t("Tư vấn món ăn: 0913 576 663")}</a></div></section>
      <section className="gallery-section section-pad container" id="thu-vien"><div className="section-heading"><div><p className="eyebrow">{t("03 / LITTLE MOMENTS, BIG MEMORIES")}</p><h2>Hideaway, <em>{t("qua từng góc nhỏ.")}</em></h2></div><span className="gallery-hint"><Sparkles size={16}/>{t("Ảnh thực tế tại Choose Hideaway")}</span></div><div className="gallery-grid">{gallery.slice(0,4).map((item,i)=><button key={item.src} className={`gallery-item gallery-item-${i}`} onClick={()=>openGallery(i)} aria-label={t("Mở ảnh: {caption}",{caption:t(item.caption)})}><img src={item.src} alt={t(item.caption)} loading="lazy"/><span>{t(item.caption)}<ArrowUpRight size={18}/></span></button>)}</div><button className="gallery-more text-link" onClick={()=>openGallery(4)}>{t("Xem thêm khoảnh khắc ")}<ArrowRight size={17}/></button></section>
      <section className="visit-section" id="lien-he"><div className="container visit-grid"><div><p className="eyebrow">{t("04 / FIND YOUR HIDEAWAY")}</p><h2>{t("Chúng tôi ở đây.")}<br/><em>{t("Chờ bạn ghé.")}</em></h2><p>{t("Một kỳ nghỉ ngắn hay một bữa tối bên nhau,")}<br/>{t("luôn có một lý do để đến Hideaway.")}</p><div className="contact-row"><MapPin/><div><small>{t("ĐỊA CHỈ")}</small><strong>147 Nguyễn Huệ, Ninh Bình</strong><a href={mapsUrl} target="_blank" rel="noopener noreferrer">{t("Chỉ đường trên Google Maps ")}<ArrowUpRight size={14}/></a></div></div><div className="contact-row"><Phone/><div><small>{t("ĐẶT CHỖ & TƯ VẤN")}</small><a className="contact-phone" href="tel:0913576663">0913 576 663</a></div></div></div><div className="visit-photo"><img src="/images/choose-entrance.jpg" alt={t("Cổng Choose Hideaway tại 147 Nguyễn Huệ, Ninh Bình")} loading="lazy"/><a href={mapsUrl} className="map-card" target="_blank" rel="noopener noreferrer"><span><MapPin size={22}/><span>Choose Hideaway<small>147 Nguyễn Huệ · Ninh Bình</small></span></span><ArrowUpRight size={21}/></a></div></div></section>
      <section className="faq-section container"><p className="eyebrow">{t("TRƯỚC KHI BẠN GHÉ")}</p><div className="faq-grid"><details><summary>{t("Đặt phòng trên website như thế nào?")}</summary><p>{t("Chọn ngày, số khách và loại phòng rồi gửi yêu cầu. Yêu cầu được lưu ở trạng thái chờ xác nhận; Choose Hideaway sẽ liên hệ để báo giá và tình trạng phòng. Bạn cũng có thể xem giá và đặt qua ")}<a href={bookingUrl} target="_blank" rel="noopener noreferrer">Booking.com</a>.</p></details><details><summary>{t("Tôi có thể chỉ đến dùng bữa không?")}</summary><p>{t("Bạn có thể gửi yêu cầu đặt bàn mà không cần đặt phòng. Hãy cho chúng tôi biết ngày, giờ đến, số khách và các lưu ý về ăn uống để nhà hàng liên hệ xác nhận.")}</p></details><details><summary>{t("Tôi cần thanh toán trước không?")}</summary><p>{t("Biểu mẫu này chưa thu tiền. Giá, phương thức thanh toán và điều kiện hủy sẽ được trao đổi khi Choose Hideaway xác nhận yêu cầu. Với đặt qua Booking.com, hãy xem chính sách của lựa chọn bạn đặt.")}</p></details><details><summary>{t("Liên hệ nhanh với Choose Hideaway?")}</summary><p>{t("Gọi ")}<a href="tel:0913576663">0913 576 663</a>{t(" để hỏi về phòng, thực đơn, thời gian phục vụ hoặc thay đổi yêu cầu đặt chỗ.")}</p></details></div></section>
    </main>
    <footer><div className="container footer-top"><Brand light/><p>{t("Stay a little. Feel a lot.")}</p><a href="#" className="back-top">{t("Về đầu trang ")}<ArrowUpRight size={17}/></a></div><div className="container footer-bottom"><span>© {today?today.slice(0,4):'2026'} Choose Hideaway. {t("Homestay & Restaurant.")}</span><a href={bookingUrl} target="_blank" rel="noopener noreferrer">{t("Thông tin lưu trú trên Booking.com ")}<ArrowUpRight size={13}/></a></div></footer>
    <div className="mobile-booking"><button onClick={()=>openBooking('room')}><BedDouble size={18}/>{t("Đặt phòng")}</button><button onClick={()=>openBooking('table')}><Utensils size={18}/>{t("Đặt bàn")}</button><a href="tel:0913576663" aria-label={t("Gọi Choose Hideaway")}><Phone size={18}/></a></div>

    <dialog ref={bookingRef} className="booking-dialog" onCancel={e=>{if(busy)e.preventDefault();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)bookingRef.current?.close();}} aria-labelledby="booking-title">
      <button className="dialog-close" aria-label={t("Đóng đặt chỗ")} disabled={busy} onClick={()=>bookingRef.current?.close()}><X size={21}/></button>
      <LanguageSwitcher/>
      {confirmation?<div className="confirmation" role="status"><CheckCircle2 size={50}/><p className="eyebrow">{t("HẸN GẶP BẠN Ở HIDEAWAY")}</p><h2 id="booking-title">{t("Đã nhận yêu cầu!")}</h2><p>{t("Cảm ơn ")}{confirmation.name}{t(". Yêu cầu ")}{confirmation.kind==='room'?t("đặt phòng"):t("đặt bàn")}{t(" của bạn đã được lưu và đang ")}<strong>{t("chờ xác nhận")}</strong>.</p><div className="confirmation-ticket"><small>{t("MÃ YÊU CẦU")}</small><strong>{confirmation.id}</strong><span>{formatDate(confirmation.date)} {confirmation.kind==='room'?`→ ${formatDate(confirmation.end)}`:`· ${confirmation.time}`} · {confirmation.guests}{t(" khách")}</span></div><p>{t("Để xác nhận giá và tình trạng chỗ ngay, hãy gọi ")}<a href="tel:0913576663">0913 576 663</a>{t(" và cung cấp mã này.")}</p><button className="button button-green" onClick={()=>bookingRef.current?.close()}>{t("Hoàn tất ")}<Check size={18}/></button></div>:<>
        <p className="eyebrow">{t("LET’S MAKE A LITTLE PLAN")}</p><h2 id="booking-title">{kind==='room'?t("Một kỳ nghỉ dành cho bạn."):t("Một bàn ăn dành cho bạn.")}</h2><p className="modal-intro">{t("Điền thông tin để Choose Hideaway liên hệ xác nhận.")}</p>
        <div className="modal-tabs"><button className={kind==='room'?'active':''} onClick={()=>{setKind('room');setError('');}}><BedDouble size={17}/>{t("Đặt phòng")}</button><button className={kind==='table'?'active':''} onClick={()=>{setKind('table');setError('');}}><Utensils size={17}/>{t("Đặt bàn")}</button></div>
        <form onSubmit={submit} className="reservation-form">{kind==='room'&&<RoomPicker value={selectedType} onChange={setSelectedType} expanded={roomChoicesExpanded} onExpandedChange={setRoomChoicesExpanded} disabled={busy}/>}<div className="form-grid">
          <label>{t("Họ và tên ")}<span>*</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder={t("Tên của bạn")}/></label><label>{t("Số điện thoại ")}<span>*</span><input name="phone" required type="tel" minLength={9} maxLength={22} autoComplete="tel" placeholder="0913 576 663"/></label>
          <label className="full">Email <small>{t("(không bắt buộc)")}</small><input name="email" type="email" maxLength={200} autoComplete="email" placeholder="ban@email.com"/></label>
          <label>{kind==='room'?t("Ngày nhận phòng"):t("Ngày dùng bữa")} <span>*</span><input type="date" required min={today} value={start} onChange={e=>changeStart(e.target.value)}/></label>
          {kind==='room'?<label>{t("Ngày trả phòng ")}<span>*</span><input type="date" required min={start?nextDay(start):today} value={end} onChange={e=>setEnd(e.target.value)}/></label>:<label>{t("Giờ đến ")}<span>*</span><input type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>}
          <label>{t("Số khách ")}<span>*</span><select value={guests} onChange={e=>setGuests(e.target.value)}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1}{t(" khách")}</option>)}</select></label>
          {kind==='room'&&<label>{t("Số phòng / giường ")}<span>*</span><input name="rooms" type="number" min={1} max={10} defaultValue={1} required/></label>}
          <label className="full">{kind==='room'?t("Lời nhắn cho chúng tôi"):t("Lưu ý về bàn & ăn uống")}<textarea name="notes" maxLength={1000} rows={2} placeholder={kind==='room'?t("Giờ đến dự kiến, trẻ em, nhu cầu đặc biệt…"):t("Dị ứng thực phẩm, nhu cầu chỗ ngồi, có trẻ em…")}/></label>
        </div><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input type="checkbox" name="consent" required/><span>{t("Tôi đồng ý để Choose Hideaway sử dụng thông tin đã cung cấp để liên hệ và xử lý yêu cầu đặt chỗ.")}</span></label><p className="form-note">{t("Đây là yêu cầu đặt chỗ, chưa bảo đảm còn phòng/bàn. Giá và điều kiện sẽ được xác nhận khi liên hệ. Chưa thu tiền qua biểu mẫu.")}</p>{error&&<p role="alert" className="form-error">{t(error)}</p>}<button type="submit" className="button button-green submit-button" disabled={busy}>{busy?t("Đang gửi yêu cầu…"):kind==='room'?t("Gửi yêu cầu đặt phòng"):t("Gửi yêu cầu đặt bàn")}<ArrowUpRight size={18}/></button></form>
      </>}
    </dialog>
    <dialog ref={roomRef} className="room-dialog" aria-labelledby="room-dialog-title" onClick={e=>{if(e.target===e.currentTarget)roomRef.current?.close();}}><button className="dialog-close" onClick={()=>roomRef.current?.close()} aria-label={t("Đóng chi tiết phòng")}><X/></button>{selectedRoom&&<><img className="detail-image" src={selectedRoom.image} alt={t("Không gian Choose Hideaway — {room}",{room:t(selectedRoom.name)})}/><div className="detail-content"><p className="eyebrow">{t("YOUR STAY AT HIDEAWAY")}</p><h2 id="room-dialog-title">{t(selectedRoom.name)}</h2><p>{t(selectedRoom.description)}</p><div className="room-features">{selectedRoom.features.map(f=><span key={f}>{t(f)}</span>)}</div><p className="form-note">{t("Ảnh giới thiệu không gian lưu trú. Vui lòng liên hệ để xác nhận phòng cụ thể, số khách phù hợp và giá theo ngày.")}</p><button className="button button-green" onClick={()=>openBooking('room',selectedRoom.name)}>{t("Yêu cầu đặt phòng ")}<ArrowUpRight size={18}/></button></div></>}</dialog>
    <dialog ref={galleryRef} className="lightbox" aria-label={t("Thư viện ảnh Choose Hideaway")} onKeyDown={e=>{if(e.key==='ArrowRight')setLightbox((lightbox+1)%gallery.length);if(e.key==='ArrowLeft')setLightbox((lightbox+gallery.length-1)%gallery.length);}} onClick={e=>{if(e.target===e.currentTarget)galleryRef.current?.close();}}><button className="dialog-close" aria-label={t("Đóng ảnh")} onClick={()=>galleryRef.current?.close()}><X/></button><img src={gallery[lightbox].src} alt={t(gallery[lightbox].caption)}/><div className="lightbox-controls"><button aria-label={t("Ảnh trước")} onClick={()=>setLightbox((lightbox+gallery.length-1)%gallery.length)}><ChevronLeft/></button><p>{t(gallery[lightbox].caption)}<small>{lightbox+1} / {gallery.length}</small></p><button aria-label={t("Ảnh tiếp theo")} onClick={()=>setLightbox((lightbox+1)%gallery.length)}><ChevronRight/></button></div></dialog>
  </>;
}
