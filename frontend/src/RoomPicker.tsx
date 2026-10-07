import { useRef } from 'react';
import { BedDouble, Check, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import { roomTypes } from '@choose-hideaway/contracts';
import { useLanguage } from './i18n';
import './room-picker.css';

type RoomType = typeof roomTypes[number];
type Choice = {name:RoomType;image?:string;category:string;description:string;features:string[]};
const choices:Choice[] = [
  {name:'Queen nhìn ra vườn',image:'/images/booking-3.jpg',category:'Phòng riêng',description:'Không gian riêng với giường đôi, dành cho khách thích nghỉ ngơi yên tĩnh.',features:['Giường đôi','Hướng vườn','Điều hòa']},
  {name:'Deluxe nhìn ra vườn',image:'/images/booking-2.jpg',category:'Phòng riêng',description:'Chọn hướng vườn để tận hưởng không gian xanh của homestay.',features:['Hướng vườn','Phòng tắm','Điều hòa']},
  {name:'Deluxe nhìn ra hồ bơi',image:'/images/choose-pool.jpg',category:'Phòng riêng',description:'Lựa chọn hướng hồ bơi cho những ngày nghỉ tại Hideaway.',features:['Hướng hồ bơi','Phòng tắm','Điều hòa']},
  {name:'Phòng gia đình',image:'/images/booking-2.jpg',category:'Gia đình / nhóm',description:'Ở cùng người thân trong một phòng; liên hệ để chọn cách bố trí giường phù hợp.',features:['Ở cùng gia đình','Phòng tắm','Điều hòa']},
  {name:'Giường tập thể',image:'/images/booking-0.jpg',category:'Giường trong phòng chung',description:'Đặt một giường tầng trong phòng dùng chung với các khách khác, không phải phòng riêng.',features:['Giường tầng','Không gian chung','Wi-Fi miễn phí']},
  {name:'Cần tư vấn',category:'Chưa biết chọn loại nào?',description:'Cho chúng tôi biết số khách và nhu cầu. Hideaway sẽ giúp bạn chọn phòng phù hợp.',features:[]},
];

export default function RoomPicker({value,onChange,expanded,onExpandedChange,disabled=false}:{value:string;onChange:(value:string)=>void;expanded:boolean;onExpandedChange:(value:boolean)=>void;disabled?:boolean}) {
  const {t}=useLanguage();
  const toggle=useRef<HTMLButtonElement>(null);
  const selected=choices.find(choice=>choice.name===value)||choices[5];
  function finish(){onExpandedChange(false);requestAnimationFrame(()=>toggle.current?.focus());}
  return <section className="room-picker" aria-labelledby="room-picker-title">
    <div className="room-picker-heading"><div><h3 id="room-picker-title">{t('Chọn chỗ nghỉ phù hợp với bạn')}</h3><p>{t('So sánh loại phòng qua hình ảnh và mô tả trước khi chọn.')}</p></div><button type="button" ref={toggle} aria-expanded={expanded} aria-controls="room-choice-list" disabled={disabled} onClick={()=>onExpandedChange(!expanded)}>{expanded?t('Thu gọn'):t('Đổi loại phòng')}{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button></div>
    {!expanded&&<div className="room-selected-summary">{selected.image?<img src={selected.image} alt={t('Ảnh giới thiệu không gian Choose Hideaway')}/>:<span className="room-consult-icon"><Leaf size={28}/></span>}<div><small><Check size={13}/>{t('Lựa chọn của bạn')}</small><strong>{t(selected.name)}</strong><p>{t(selected.description)}</p><span>{t('Liên hệ để nhận giá')}</span></div></div>}
    <div id="room-choice-list" hidden={!expanded}>
      <fieldset disabled={disabled} className="room-choice-grid"><legend>{t('Loại phòng')} *</legend>{choices.map(choice=><label key={choice.name} className={`room-choice ${value===choice.name?'is-selected':''} ${!choice.image?'room-choice-consult':''}`}>
        <input type="radio" name="roomType" value={choice.name} checked={value===choice.name} required onChange={()=>onChange(choice.name)}/>
        {choice.image?<div className="room-choice-image"><img src={choice.image} alt={t('Ảnh giới thiệu không gian Choose Hideaway')} loading="lazy"/><span>{t('Ảnh giới thiệu')}</span></div>:<span className="room-consult-icon"><Leaf size={27}/></span>}
        <div className="room-choice-content"><span className="room-choice-category">{t(choice.category)}</span><strong>{t(choice.name)}</strong><p>{t(choice.description)}</p>{choice.features.length>0&&<div className="room-choice-features">{choice.features.map(feature=><span key={feature}>{t(feature)}</span>)}</div>}<span className="room-choice-select">{value===choice.name?<><Check size={14}/>{t('Đã chọn')}</>:<><BedDouble size={14}/>{t('Chọn loại này')}</>}</span></div>
      </label>)}</fieldset>
      <p className="room-picker-photo-note">{t('Ảnh giới thiệu không gian homestay. Phòng cụ thể, sức chứa và giá theo ngày sẽ được xác nhận khi liên hệ.')}</p>
      <div className="room-picker-finish"><span>{t('Lựa chọn của bạn')}: <strong>{t(selected.name)}</strong></span><button className="button button-green" type="button" disabled={disabled} onClick={finish}>{t('Tiếp tục với lựa chọn này')}<Check size={16}/></button></div>
    </div>
  </section>;
}
