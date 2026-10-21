import { useRef, useState, type RefObject } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Download, ExternalLink, Utensils, X } from 'lucide-react';
import { LanguageSwitcher, useLanguage } from './i18n';
import menu from './restaurant-menu.json';
import './restaurant-menu.css';

const menuPdf = '/menus/choose-hideaway-menu.pdf';
type MenuItem = {name:string;price:string;description?:string};

export function MenuPreview({onOpen,compact=false}:{onOpen:()=>void;compact?:boolean}) {
  const {t}=useLanguage();
  return <div className={`menu-preview${compact?' menu-preview-compact':''}`}>
    <span className="menu-preview-icon"><BookOpen size={24} strokeWidth={1.4}/></span>
    <div><strong>{t('Chọn món cho buổi hẹn của bạn')}</strong><p>{t('Pizza lò củi, steak, mì Ý & đồ uống.')}</p></div>
    <button type="button" onClick={onOpen}>{t('Xem thực đơn')}<ArrowUpRight size={17}/></button>
  </div>;
}

export default function RestaurantMenu({dialogRef,fromBooking,onContinue}:{dialogRef:RefObject<HTMLDialogElement|null>;fromBooking:boolean;onContinue:()=>void}) {
  const {t}=useLanguage();
  const [selected,setSelected]=useState(menu[0].id);
  const contentRef=useRef<HTMLDivElement>(null);
  const section=menu.find(category=>category.id===selected)||menu[0];
  function choose(id:string){setSelected(id);contentRef.current?.scrollTo({top:0});}
  return <dialog ref={dialogRef} className="restaurant-menu-dialog" aria-labelledby="restaurant-menu-title" onClick={event=>{if(event.target===event.currentTarget)dialogRef.current?.close();}}>
    <div className="restaurant-menu-shell">
      <header className="restaurant-menu-header">
        <div><p className="eyebrow">CHOOSE HIDEAWAY · FOOD & DRINK</p><h2 id="restaurant-menu-title">{t('Thực đơn nhà hàng')}</h2></div>
        <div className="restaurant-menu-tools"><LanguageSwitcher/><button type="button" className="restaurant-menu-close" autoFocus aria-label={t('Đóng thực đơn')} onClick={()=>dialogRef.current?.close()}><X size={21}/></button></div>
      </header>
      <div className="restaurant-menu-body">
        <nav className="restaurant-menu-categories" aria-label={t('Danh mục thực đơn')}>
          <label className="restaurant-menu-select">{t('Danh mục thực đơn')}<select value={selected} onChange={event=>choose(event.target.value)}>{menu.map(category=><option key={category.id} value={category.id}>{t(category.title)}</option>)}</select></label>
          <div className="restaurant-menu-category-list">{menu.map((category,index)=><div key={category.id}>{(index===0||index===7)&&<p>{index===0?t('Món ăn'):t('Đồ uống')}</p>}<button type="button" aria-current={selected===category.id?'true':undefined} onClick={()=>choose(category.id)}>{t(category.title)}</button></div>)}</div>
        </nav>
        <div className="restaurant-menu-content" ref={contentRef}>
          <section aria-labelledby="menu-category-title" key={section.id}>
            <p className="restaurant-menu-page">{t('Trang')} {section.pages.join('–')} / 14</p>
            <h3 id="menu-category-title">{t(section.title)}</h3>
            <p className="restaurant-menu-prices">{t('Giá tính bằng nghìn đồng (VND). Ví dụ: 160 = 160.000đ.')}</p>
            {section.id==='menu-2'&&<p className="restaurant-menu-size">{t('Cỡ nhỏ 25 cm / cỡ lớn 30 cm. Giá theo thứ tự nhỏ / lớn.')}</p>}
            {section.groups.map((group,index)=><div className="restaurant-menu-group" key={index}>
              {group.title&&<h4>{t(group.title)}</h4>}
              <ul className="restaurant-menu-items">{group.items.map((item:MenuItem)=><li key={item.name}><div><h5>{item.name}</h5><span className="restaurant-menu-price">{item.price}</span></div>{item.description&&<p>{item.description}</p>}</li>)}</ul>
              {group.notes.length>0&&<p className="restaurant-menu-group-note">{group.notes.join(' ')}</p>}
            </div>)}
            <p className="restaurant-menu-source">{t('Tên món và mô tả được giữ theo thực đơn gốc.')}<br/>{t('Bạn có dị ứng hoặc nhu cầu ăn uống riêng? Hãy ghi vào phần lưu ý khi đặt bàn.')}</p>
          </section>
        </div>
      </div>
      <footer className="restaurant-menu-footer">
        <div className="restaurant-menu-files"><a href={menuPdf} target="_blank" rel="noopener noreferrer">{t('Mở PDF gốc')}<ExternalLink size={14}/></a><a href={menuPdf} download="Choose_Hideaway_Menu.pdf">{t('Tải PDF')}<Download size={14}/></a></div>
        <button type="button" className="button button-green" onClick={onContinue}>{fromBooking?<ArrowLeft size={16}/>:<Utensils size={16}/>}<span>{fromBooking?t('Quay lại đặt bàn'):t('Đặt bàn')}</span></button>
      </footer>
    </div>
  </dialog>;
}
