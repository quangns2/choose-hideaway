import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { english, vietnamese } from './translations';

export type Language = 'en' | 'vi';
export const LANGUAGE_KEY = 'choose-hideaway-language';
type Params = Record<string, string | number>;
export function translate(language:Language, key:string, params:Params={}) {
  const clean=key.trim();
  const dictionary=language==='en'?english:vietnamese;
  const translated=Object.hasOwn(dictionary,clean)?dictionary[clean]:clean;
  const text=translated.replace(/\{(\w+)\}/g,(match,name)=>String(params[name]??match));
  return (key.match(/^\s*/)?.[0]||'')+text+(key.match(/\s*$/)?.[0]||'');
}
export function initialLanguage(storage?:Pick<Storage,'getItem'>):Language {
  try {return storage?.getItem(LANGUAGE_KEY)==='vi'?'vi':'en';}catch{return 'en';}
}
type Context={language:Language;locale:string;setLanguage:(value:Language)=>void;t:(key:string,params?:Params)=>string;formatDate:(value:string|null)=>string};
const LanguageContext=createContext<Context|null>(null);
export function LanguageProvider({children}:{children:ReactNode}) {
  const [language,setLanguage]=useState<Language>(()=>{try{return initialLanguage(window.localStorage);}catch{return 'en';}});
  const locale=language==='en'?'en-GB':'vi-VN';
  const t=useCallback((key:string,params?:Params)=>translate(language,key,params),[language]);
  const formatDate=useCallback((value:string|null)=>value?new Intl.DateTimeFormat(locale,{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value+'T00:00:00+07:00')):'—',[locale]);
  useEffect(()=>{
    try {window.localStorage.setItem(LANGUAGE_KEY,language);}catch{/* The switch also works when storage is disabled. */}
    document.documentElement.lang=language;
    const admin=window.location.pathname.replace(/\/$/,'')==='/admin';
    document.title=t(admin?'Quản trị đặt chỗ | Choose Hideaway':'Choose Hideaway | Homestay & Nhà hàng tại Ninh Bình');
    document.querySelector('meta[name="description"]')?.setAttribute('content',t('Một khoảng xanh giữa Ninh Bình. Khám phá Choose Hideaway tại 147 Nguyễn Huệ, đặt phòng homestay và đặt bàn nhà hàng trực tuyến. Hotline 0913 576 663.'));
  },[language,t]);
  const value=useMemo(()=>({language,locale,t,setLanguage,formatDate}),[language,locale,t,formatDate]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const value=useContext(LanguageContext);if(!value)throw new Error('LanguageProvider is required');return value;}
export function LanguageSwitcher(){
  const {language,setLanguage}=useLanguage();
  return <div className="language-switcher" role="group" aria-label={language==='en'?'Language':'Ngôn ngữ'}>
    <button type="button" lang="en" title="English" aria-label="English" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>EN</button>
    <button type="button" lang="vi" title="Tiếng Việt" aria-label="Tiếng Việt" aria-pressed={language==='vi'} onClick={()=>setLanguage('vi')}>VI</button>
  </div>;
}

export function validationMessage(issue:{path:(string|number)[];message:string;code:string}) {
  if(issue.code==='custom'&&Object.hasOwn(english,issue.message))return issue.message;
  const messages:Record<string,string>={name:'Vui lòng nhập họ tên từ 2 đến 100 ký tự.',phone:'Vui lòng nhập số điện thoại hợp lệ.',email:'Vui lòng nhập email hợp lệ.',startDate:'Ngày không hợp lệ',endDate:'Ngày không hợp lệ',time:'Vui lòng chọn giờ đến trong tương lai.',guests:'Vui lòng chọn từ 1 đến 30 khách.',rooms:'Vui lòng chọn từ 1 đến 10 phòng/giường.',roomType:'Vui lòng chọn loại phòng hợp lệ.',notes:'Lời nhắn tối đa 1000 ký tự.',consent:'Vui lòng đồng ý để chúng tôi xử lý yêu cầu.'};
  return messages[String(issue.path[0])]||'Vui lòng kiểm tra thông tin.';
}
