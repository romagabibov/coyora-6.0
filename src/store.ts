import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Project = { 
  name: string; 
  images?: string[]; 
  link?: string;
  year?: string;
  concept?: string;
  process?: string;
  credits?: string;
  videoPreview?: string;
};
export type PortfolioData = Record<string, Project[]>;

export type PressItem = {
  year: string;
  title: string;
  publication: string;
  link: string;
};

export type LabItem = {
  id: string;
  title: string;
  image: string;
  description: string;
  experiments: { name: string; desc: string }[];
};

export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'file' | 'dropdown' | 'checkboxes';

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  allowedFileTypes?: string[];
  options?: string[]; // For dropdown
};

export type FormSchema = {
  id: string;
  category: 'volunteer' | 'internship' | 'vacancy';
  name: string;
  date: string;
  description: string;
  fields?: FormField[];
  createdAt?: any;
  allowedEmails?: string[];
  eventDate?: string;
  autoCleanupDate?: string;
  isCleanedUp?: boolean;
  status?: string;
};

export type VolunteerFormConfig = {
  title: string;
  description: string;
};

export type Collaborator = {
  name: string;
  url: string;
};

export type AboutData = {
  image: string;
};

export type BrandingData = {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
};

export type SiteData = {
  theme: 'dark' | 'light';
  lang: 'en' | 'ru' | 'az';
  branding: BrandingData;
  translations: any;
  aboutData: AboutData;
  portfolioData: PortfolioData;
  pressData: PressItem[];
  labData: LabItem[];
  collaboratorsData: Collaborator[];
  formSchemas: FormSchema[];
  volunteerFormConfig: VolunteerFormConfig;
  vacanciesFormConfig: VolunteerFormConfig;
  internshipsFormConfig: VolunteerFormConfig;
  contact: {
    email: string;
    phone: string;
    address: string;
    instagram: string;
    linkedin: string;
    website: string;
    telegram: string;
    whatsapp: string;
    formspreeId: string;
    footerWebsiteUrl: string;
    googleDriveScriptUrl?: string;
  };
  setTheme: (theme: 'dark' | 'light') => void;
  setLang: (lang: 'en' | 'ru' | 'az') => void;
  updateTranslations: (lang: string, key: string, value: string) => void;
  updatePortfolio: (category: keyof PortfolioData, index: number, project: Project) => void;
  addProject: (category: keyof PortfolioData, project: Project) => void;
  removeProject: (category: keyof PortfolioData, index: number) => void;
  updatePress: (index: number, item: PressItem) => void;
  addPress: (item: PressItem) => void;
  removePress: (index: number) => void;
  updateLab: (index: number, item: LabItem) => void;
  addLab: (item: LabItem) => void;
  removeLab: (index: number) => void;
  updateContact: (key: string, value: string) => void;
  updateBranding: (branding: BrandingData) => void;
  updateCollaborators: (collaborators: Collaborator[]) => void;
  updateAboutData: (data: AboutData) => void;
  addFormSchema: (schema: FormSchema) => void;
  updateFormSchema: (id: string, schema: FormSchema) => void;
  removeFormSchema: (id: string) => void;
  updateVolunteerFormConfig: (config: VolunteerFormConfig) => void;
  updateVacanciesFormConfig: (config: VolunteerFormConfig) => void;
  updateInternshipsFormConfig: (config: VolunteerFormConfig) => void;
  reset: () => void;
  resetSection: (section: string) => void;
};

export const defaultTranslations = {
  en: {
    nav_design: "Design", nav_about: "About", nav_contact: "Contact",
    studio: "studio",
    s_fashion: "Fashion", s_fashion_p: "Collection creation & conceptual wear.",
    s_event: "Event", s_event_p: "Immersive spaces & event architecture.",
    s_graphic: "Graphic", s_graphic_p: "Branding & visual communications.",
    s_web: "Web", s_web_p: "Digital experiences & modern interfaces.",
    about_title: "RAMAZAN HABIBOV",
    about_text: "Based in Baku, Ramazan Habibov is a visionary designer bridging the gap between physical fashion and digital expression. Under COYORA studio, he explores new silhouettes, immersive event architectures, and bold graphic identities for the next generation of brands.",
    back_to_projects: "BACK TO PROJECTS",
    coming_soon: "Projects coming soon...",
    lets_talk: "HAVE A COMPLEX PROJECT? LET'S TALK.",
    visit_site: "VISIT LIVE SITE",
    sound: "SOUND",
    light: "LIGHT",
    dark: "DARK",
    core_capabilities: "[ CORE CAPABILITIES ]",
    select_module: "SELECT MODULE",
    lab_experiments: "[ LAB / EXPERIMENTS ]",
    rd_division: "R&D DIVISION",
    press_media: "[ PRESS & MEDIA ]",
    publications: "PUBLICATIONS",
    manifesto: "[ MANIFESTO ]",
    collaborators: "[ COLLABORATORS ]",
    initiate_sequence: "[ INITIATE SEQUENCE ]",
    name: "NAME",
    company: "COMPANY",
    project_type: "PROJECT TYPE",
    budget: "BUDGET",
    message: "MESSAGE",
    send_inquiry: "SEND INQUIRY",
    subscribe_void: "[ SUBSCRIBE TO THE VOID ]",
    enter_email: "ENTER EMAIL",
    join: "JOIN",
    working_worldwide: "WORKING WORLDWIDE",
    vacancies: "VACANCIES",
    internship: "INTERNSHIP",
    vacancies_info: "Information about upcoming vacancies will be posted here.",
    internship_info: "Information about upcoming internships will be posted here.",
    volunteer: "VOLUNTEER",
    close: "[ CLOSE ]",
    timeline: "[ TIMELINE ]",
    experiments: "[ EXPERIMENTS ]",
    success_contact: "Message sent successfully!",
    success_subscribe: "Subscribed successfully!",
    success_copy: "Link copied to clipboard!",
    select_event: "Select an event to participate in",
    no_events: "No events available at the moment.",
    form_not_configured: "The volunteer form has not been configured yet. Please check back later.",
    designed_by: "DESIGNED & DEVELOPED BY COYORA",
    all_rights_reserved: "ALL RIGHTS RESERVED",
    "Back to Main Portal": "Back to Main Portal",
    "My Cabinet": "My Cabinet",
    "Disconnect Session": "Disconnect Session",
    "Your Details": "Your Details",
    "Matrix configuration required for deployments.": "Matrix configuration required for deployments.",
    "Name": "Name",
    "Surname": "Surname",
    "Date of Birth": "Date of Birth",
    "Email": "Email",
    "Phone Number": "Phone Number",
    "University / Organization": "University / Organization",
    "Field of Activity": "Field of Activity",
    "Languages Known": "Languages Known",
    "Past Events": "Past Events",
    "Processing...": "Processing...",
    "Sync Configuration": "Sync Configuration",
    "Cancel Update": "Cancel Update",
    "Profile Info": "Profile Info",
    "Born": "Born",
    "Age": "Age",
    "Comms": "Comms",
    "Edit settings": "Edit settings",
    "My Events & Certificates": "My Events & Certificates",
    "Certificate Issued": "Certificate Issued",
    "Claim & Download": "Claim & Download",
    "Applied": "Applied",
    "Processing Matrix": "Processing Matrix",
    "Concluded Validated": "Concluded Validated",
    "No activity registered in subsystem": "No activity registered in subsystem",
    "Active Deployments": "Active Deployments",
    "Volunteer": "Volunteer",
    "JOIN FORCE": "JOIN FORCE",
    "Vacancy": "Vacancy",
    "EMPLOYMENT": "EMPLOYMENT",
    "Intern": "Intern",
    "EDUCATION": "EDUCATION",
    "Step 1: Complete Your Profile": "Step 1: Complete Your Profile",
    "Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.": "Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.",
    "Verified Achievement": "Verified Achievement",
    "Digital signature active.": "Digital signature active.",
    "Format: High Resolution PDF": "Format: High Resolution PDF",
    "Secure Download": "Secure Download",
    "cab_limit": "You can only download this certificate once per day to prevent abuse.",
    "Personal Information": "Personal Information",
    "Contact & Status": "Contact & Status",
    "Experience": "Experience",
    "Continue with Google": "Continue with Google",
    "Create Account": "Create Account",
    "Secure auth loop": "Secure auth loop",
    "System: Active": "System: Active",
    "Provide Access": "Provide Access",
    "Expand your professional matrix by applying for open roles, volunteering opportunities, and internships.": "Expand your professional matrix by applying for open roles, volunteering opportunities, and internships.",
    "OPEN": "OPEN",
    "Cabinet": "Cabinet",
    "BACK TO EXPERIENCE": "BACK TO EXPERIENCE",
    "Certificate design for this event is not ready yet. Please try later.": "Certificate design for this event is not ready yet. Please try later.",
    "Achievement Unlocked": "Achievement Unlocked",
    "Processing": "Processing",
    "Concluded": "Concluded",
    "Enter": "Enter",
    "Verified ID": "Verified ID",
    "Age / Date of Birth": "Age / Date of Birth",
    "Email / Comms": "Email / Comms",
    "Please wait for the file to finish uploading.": "Please wait for the file to finish uploading.",
    "This field is required.": "This field is required.",
    "Uploading to Cloud... Please wait": "Uploading to Cloud... Please wait",
    "Upload failed. Try again.": "Upload failed. Try again.",
    "File uploaded successfully:": "File uploaded successfully:",
    "View File": "View File",
    "Type your answer...": "Type your answer...",
    "Application submitted successfully!": "Application submitted successfully!",
    "Back": "Back",
    "Submit": "Submit",
    "Submitting...": "Submitting...",
    "Next": "Next",
    "Please wait for file to finish uploading.": "Please wait for file to finish uploading."
  },
  ru: {
    nav_design: "Дизайн", nav_about: "Обо мне", nav_contact: "Контакты",
    studio: "студия",
    s_fashion: "Fashion", s_fashion_p: "Создание коллекций и концептуальной одежды.",
    s_event: "Event", s_event_p: "Иммерсивные пространства и архитектура событий.",
    s_graphic: "Графика", s_graphic_p: "Брендинг и визуальные коммуникации.",
    s_web: "Web", s_web_p: "Цифровые решения и современные интерфейсы.",
    about_title: "РАМАЗАН ГАБИБОВ",
    about_text: "Базирующийся в Баку, Рамазан Габибов — дизайнер-визионер, стирающий границы между физической модой и цифровым самовыражением. В рамках студии COYORA он исследует новые силуэты, иммерсивную архитектуру событий и смелые графические идентичности.",
    back_to_projects: "НАЗАД К ПРОЕКТАМ",
    coming_soon: "Проекты скоро появятся...",
    lets_talk: "ЕСТЬ СЛОЖНЫЙ ПРОЕКТ? ДАВАЙТЕ ОБСУДИМ.",
    visit_site: "ПОСЕТИТЬ САЙТ",
    sound: "ЗВУК",
    light: "СВЕТЛАЯ",
    dark: "ТЕМНАЯ",
    core_capabilities: "[ ОСНОВНЫЕ НАПРАВЛЕНИЯ ]",
    select_module: "ВЫБРАТЬ МОДУЛЬ",
    lab_experiments: "[ ЛАБОРАТОРИЯ / ЭКСПЕРИМЕНТЫ ]",
    rd_division: "ОТДЕЛ R&D",
    press_media: "[ ПРЕССА И МЕДИА ]",
    publications: "ПУБЛИКАЦИИ",
    manifesto: "[ МАНИФЕСТ ]",
    collaborators: "[ СОТРУДНИЧЕСТВО ]",
    initiate_sequence: "[ НАЧАТЬ ПОСЛЕДОВАТЕЛЬНОСТЬ ]",
    name: "ИМЯ",
    company: "КОМПАНИЯ",
    project_type: "ТИП ПРОЕКТА",
    budget: "БЮДЖЕТ",
    message: "СООБЩЕНИЕ",
    send_inquiry: "ОТПРАВИТЬ ЗАПРОС",
    subscribe_void: "[ ПОДПИСАТЬСЯ НА ПУСТОТУ ]",
    enter_email: "ВВЕДИТЕ EMAIL",
    join: "ПРИСОЕДИНИТЬСЯ",
    working_worldwide: "РАБОТАЕМ ПО ВСЕМУ МИРУ",
    vacancies: "ВАКАНСИИ",
    internship: "СТАЖИРОВКА",
    vacancies_info: "Информация о предстоящих вакансиях будет опубликована здесь.",
    internship_info: "Информация о предстоящих стажировках будет опубликована здесь.",
    volunteer: "ВОЛОНТЕРСТВО",
    close: "[ ЗАКРЫТЬ ]",
    timeline: "[ ХРОНОЛОГИЯ ]",
    experiments: "[ ЭКСПЕРИМЕНТЫ ]",
    success_contact: "Сообщение успешно отправлено!",
    success_subscribe: "Успешная подписка!",
    success_copy: "Ссылка скопирована в буфер обмена!",
    select_event: "Выберите мероприятие для участия",
    no_events: "На данный момент нет доступных мероприятий.",
    form_not_configured: "Форма волонтера еще не настроена. Пожалуйста, зайдите позже.",
    designed_by: "ДИЗАЙН И РАЗРАБОТКА COYORA",
    all_rights_reserved: "ВСЕ ПРАВА ЗАЩИЩЕНЫ",
    "Back to Main Portal": "Вернуться на Главную",
    "My Cabinet": "Мой Кабинет",
    "Disconnect Session": "Отключить сессию",
    "Your Details": "Ваши данные",
    "Matrix configuration required for deployments.": "Для развертывания требуется настройка матрицы.",
    "Name": "Имя",
    "Surname": "Фамилия",
    "Date of Birth": "Дата рождения",
    "Email": "Email",
    "Phone Number": "Номер телефона",
    "University / Organization": "Университет / Организация",
    "Field of Activity": "Сфера деятельности",
    "Languages Known": "Знание языков",
    "Past Events": "Прошлые мероприятия",
    "Processing...": "В обработке...",
    "Sync Configuration": "Синхронизировать настройки",
    "Cancel Update": "Отменить",
    "Profile Info": "Информация профиля",
    "Born": "Родился",
    "Age": "Возраст",
    "Comms": "Связь",
    "Edit settings": "Редактировать",
    "My Events & Certificates": "Мои Мероприятия и Сертификаты",
    "Certificate Issued": "Сертификат Выдан",
    "Claim & Download": "Скачать",
    "Applied": "Подано",
    "Processing Matrix": "В процессе",
    "Concluded Validated": "Успешно завершено",
    "No activity registered in subsystem": "Нет активности в подсистеме",
    "Active Deployments": "Доступные Мероприятия",
    "Volunteer": "Волонтерство",
    "JOIN FORCE": "ПРИСОЕДИНИТЬСЯ",
    "Vacancy": "Вакансия",
    "EMPLOYMENT": "ТРУДОУСТРОЙСТВО",
    "Intern": "Стажировка",
    "EDUCATION": "ОБРАЗОВАНИЕ",
    "Step 1: Complete Your Profile": "Шаг 1: Заполните профиль",
    "Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.": "Прежде чем отправить заявку, вы должны заполнить свой профиль. После сохранения вы увидите доступные вакансии и формы.",
    "Verified Achievement": "Подтвержденное достижение",
    "Digital signature active.": "Цифровая подпись активна.",
    "Format: High Resolution PDF": "Формат: PDF высокого разрешения",
    "Secure Download": "Безопасное скачивание",
    "cab_limit": "Во избежание злоупотреблений, вы можете скачать этот сертификат только один раз в день.",
    "Personal Information": "Личная информация",
    "Contact & Status": "Контакты и статус",
    "Experience": "Опыт",
    "Continue with Google": "Продолжить с Google",
    "Create Account": "Создать аккаунт",
    "Secure auth loop": "Безопасный цикл авторизации",
    "System: Active": "Система: Активна",
    "Provide Access": "Предоставить доступ",
    "Expand your professional matrix by applying for open roles, volunteering opportunities, and internships.": "Расширьте свою профессиональную матрицу, подавая заявки на открытые вакансии, стажировки и волонтерство.",
    "OPEN": "ОТКРЫТО",
    "Cabinet": "Кабинет",
    "BACK TO EXPERIENCE": "НАЗАД К ОПЫТУ",
    "Certificate design for this event is not ready yet. Please try later.": "Дизайн сертификата для этого мероприятия еще не готов. Пожалуйста, попробуйте позже.",
    "Achievement Unlocked": "Достижение разблокировано",
    "Processing": "В обработке",
    "Concluded": "Завершено",
    "Enter": "Войти в",
    "Verified ID": "Подтвержденный ID",
    "Age / Date of Birth": "Возраст / Дата рождения",
    "Email / Comms": "Email / Связь",
    "Please wait for the file to finish uploading.": "Пожалуйста, подождите окончания загрузки файла.",
    "This field is required.": "Это поле обязательно для заполнения.",
    "Uploading to Cloud... Please wait": "Загрузка в облако... Пожалуйста, подождите",
    "Upload failed. Try again.": "Ошибка загрузки. Попробуйте еще раз.",
    "File uploaded successfully:": "Файл успешно загружен:",
    "View File": "Посмотреть файл",
    "Type your answer...": "Введите ваш ответ...",
    "Application submitted successfully!": "Заявка успешно отправлена!",
    "Back": "Назад",
    "Submit": "Отправить",
    "Submitting...": "Отправка...",
    "Next": "Далее",
    "Please wait for file to finish uploading.": "Пожалуйста, подождите окончания загрузки файла."
  },
  az: {
    nav_design: "Dizayn", nav_about: "Haqqında", nav_contact: "Əlaqə",
    studio: "studiya",
    s_fashion: "Moda", s_fashion_p: "Kolleksiyaların və konseptual geyimlərin yaradılması.",
    s_event: "Tədbir", s_event_p: "İmmersiv məkanlar və tədbir arxitekturası.",
    s_graphic: "Qrafik", s_graphic_p: "Brendinq və vizual kommunikasiyalar.",
    s_web: "Veb", s_web_p: "Rəqəmsal təcrübələr və müasir interfeyslər.",
    about_title: "RAMAZAN HƏBİBOV",
    about_text: "Bakıda fəaliyyət göstərən Ramazan Həbibov fiziki moda və rəqəmsal ifadə arasındakı fərqi aradan qaldıran vizioner dizaynerdir. COYORA studiyası altında o, yeni siluetlər, immersiv tədbir arxitekturaları və cəsarətli qrafik kimliklər araşdırır.",
    back_to_projects: "LAYİHƏLƏRƏ QAYIT",
    coming_soon: "Layihələr tezliklə...",
    lets_talk: "MÜRƏKKƏB LAYİHƏNİZ VAR? GƏLİN DANIŞAQ.",
    visit_site: "SAYTA KEÇİD",
    sound: "SƏS",
    light: "AÇIQ",
    dark: "TÜND",
    core_capabilities: "[ ƏSAS İSTİQAMƏTLƏR ]",
    select_module: "MODUL SEÇİN",
    lab_experiments: "[ LABORATORİYA / EKSPERİMENTLƏR ]",
    rd_division: "R&D BÖLMƏSİ",
    press_media: "[ MƏTBUAT VƏ MEDİA ]",
    publications: "NƏŞRLƏR",
    manifesto: "[ MANİFEST ]",
    collaborators: "[ ƏMƏKDAŞLAR ]",
    initiate_sequence: "[ ARDICILLIĞI BAŞLAT ]",
    name: "AD",
    company: "ŞİRKƏT",
    project_type: "LAYİHƏ NÖVÜ",
    budget: "BÜDCƏ",
    message: "MESAJ",
    send_inquiry: "SORĞU GÖNDƏR",
    subscribe_void: "[ BOŞLUĞA ABUNƏ OL ]",
    enter_email: "EMAİL DAXİL EDİN",
    join: "QOŞUL",
    working_worldwide: "BÜTÜN DÜNYA ÜZRƏ İŞLƏYİRİK",
    vacancies: "VAKANSİYALAR",
    internship: "TƏCRÜBƏ",
    vacancies_info: "Qarşıdan gələn vakansiyalar haqqında məlumat burada yerləşdiriləcək.",
    internship_info: "Qarşıdan gələn təcrübə proqramları haqqında məlumat burada yerləşdiriləcək.",
    volunteer: "KÖNÜLLÜ",
    close: "[ BAĞLA ]",
    timeline: "[ XRONOLOGİYA ]",
    experiments: "[ EKSPERİMENTLƏR ]",
    success_contact: "Mesaj uğurla göndərildi!",
    success_subscribe: "Uğurla abunə oldunuz!",
    success_copy: "Link mübadilə buferinə kopyalandı!",
    select_event: "İştirak etmək üçün tədbir seçin",
    no_events: "Hazırda heç bir tədbir yoxdur.",
    form_not_configured: "Könüllü forması hələ tənzimlənməyib. Zəhmət olmasa daha sonra yoxlayın.",
    designed_by: "COYORA TƏRƏFİNDƏN DİZAYN VƏ İNKİŞAF ETDİRİLMİŞDİR",
    all_rights_reserved: "BÜTÜN HÜQUQLAR QORUNUR",
    "Back to Main Portal": "Ana səhifəyə qayıt",
    "My Cabinet": "Mənim Kabinetim",
    "Disconnect Session": "Sessiyanı Ayır",
    "Your Details": "Sizin Məlumatlarınız",
    "Matrix configuration required for deployments.": "Tədbirlər üçün matris konfiqurasiyası tələb olunur.",
    "Name": "Ad",
    "Surname": "Soyad",
    "Date of Birth": "Doğum tarixi",
    "Email": "Email",
    "Phone Number": "Telefon nömrəsi",
    "University / Organization": "Universitet / Təşkilat",
    "Field of Activity": "Fəaliyyət sahəsi",
    "Languages Known": "Bilinən dillər",
    "Past Events": "Keçmiş tədbirlər",
    "Processing...": "Zəhmət olmasa gözləyin...",
    "Sync Configuration": "Məlumatları Saxla",
    "Cancel Update": "Ləğv et",
    "Profile Info": "Profil Məlumatı",
    "Born": "Doğum",
    "Age": "Yaş",
    "Comms": "Əlaqə",
    "Edit settings": "Redaktə et",
    "My Events & Certificates": "Tədbirlərim və Sertifikatlarım",
    "Certificate Issued": "Sertifikat Verildi",
    "Claim & Download": "Şəhadətnaməni Yüklə",
    "Applied": "Müraciət edildi",
    "Processing Matrix": "Yoxlama prosesində",
    "Concluded Validated": "Uğurla tamamlandı",
    "No activity registered in subsystem": "Altsistemdə fəaliyyət qeydə alınmayıb",
    "Active Deployments": "Aktiv Tədbirlər",
    "Volunteer": "Könüllü",
    "JOIN FORCE": "QOŞUL",
    "Vacancy": "Vakansiya",
    "EMPLOYMENT": "İŞ MÜHİTİ",
    "Intern": "Təcrübə",
    "EDUCATION": "TƏHSİL",
    "Step 1: Complete Your Profile": "Addım 1: Profilinizi tamamlayın",
    "Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.": "Müraciət etməzdən əvvəl profilinizi tamamlamalısınız. Yadda saxladıqdan sonra aktiv vakansiyaları və formaları görəcəksiniz.",
    "Verified Achievement": "Təsdiqlənmiş Nailiyyət",
    "Digital signature active.": "Rəqəmsal imza aktivdir.",
    "Format: High Resolution PDF": "Format: Yüksək Keyfiyyətli PDF",
    "Secure Download": "Təhlükəsiz Yükləmə",
    "cab_limit": "İstifadənin qarşısını almaq üçün bu sertifikatı gündə yalnız bir dəfə yükləyə bilərsiniz.",
    "Personal Information": "Şəxsi Məlumat",
    "Contact & Status": "Əlaqə və Status",
    "Experience": "Təcrübə",
    "Continue with Google": "Google ilə davam et",
    "Create Account": "Hesab Yarat",
    "Secure auth loop": "Təhlükəsiz avtorizasiya",
    "System: Active": "Sistem: Aktiv",
    "Provide Access": "Giriş təmin et",
    "Expand your professional matrix by applying for open roles, volunteering opportunities, and internships.": "Açıq vakansiyalara, təcrübə və könüllülük proqramlarına müraciət edərək peşəkar matrisinizi genişləndirin.",
    "OPEN": "AÇIQ",
    "Cabinet": "Kabinet",
    "BACK TO EXPERIENCE": "TƏCRÜBƏYƏ QAYIT",
    "Certificate design for this event is not ready yet. Please try later.": "Bu tədbir üçün sertifikat dizaynı hələ hazır deyil. Zəhmət olmasa daha sonra bir daha cəhd edin.",
    "Achievement Unlocked": "Nailiyyət Əldə Edildi",
    "Processing": "Yoxlanılır",
    "Concluded": "Tamamlandı",
    "Enter": "Daxil ol",
    "Verified ID": "Təsdiqlənmiş ID",
    "Age / Date of Birth": "Yaş / Doğum tarixi",
    "Email / Comms": "Email / Əlaqə",
    "Please wait for the file to finish uploading.": "Zəhmət olmasa faylın yüklənməsini gözləyin.",
    "This field is required.": "Bu sahə mütləqdir.",
    "Uploading to Cloud... Please wait": "Buluda yüklənir... Zəhmət olmasa gözləyin",
    "Upload failed. Try again.": "Yükləmə uğursuz oldu. Yenidən cəhd edin.",
    "File uploaded successfully:": "Fayl uğurla yükləndi:",
    "View File": "Fayla bax",
    "Type your answer...": "Cavabınızı yazın...",
    "Application submitted successfully!": "Müraciət uğurla göndərildi!",
    "Back": "Geri",
    "Submit": "Göndər",
    "Submitting...": "Göndərilir...",
    "Next": "İrəli",
    "Please wait for file to finish uploading.": "Zəhmət olmasa faylın yüklənməsini gözləyin."
  }
};

const defaultPortfolioData: PortfolioData = {
  fashion: [
    { 
      name: "Coyora SS/25 Collection", 
      year: "2025",
      concept: "A futuristic take on traditional silhouettes, blending digital aesthetics with physical craftsmanship.",
      process: "Developed over 6 months using 3D prototyping before physical construction.",
      credits: "Design: Ramazan Habibov\nPhotography: Studio X",
      images: ["https://i.ibb.co/PZdCSq5H/316.png", "https://i.ibb.co/7t5TSskX/385.png"] 
    },
    { 
      name: "Coyora FW/25-26 Collection", 
      year: "2025", 
      concept: "Exploring the dichotomy between warmth and cold, using innovative thermal fabrics.",
      process: "Iterative design process focusing on material behavior in extreme temperatures.",
      credits: "Design: Ramazan Habibov\nStyling: Anna K.",
      images: ["https://i.ibb.co/5g09vLFN/COYORA-fw25-26-2.jpg", "https://i.ibb.co/v6tcZjfZ/COYORA-fw25-26-3-2.jpg", "https://i.ibb.co/gFV3g3NX/38e6090c-c5ac-4e2e-a817-a5a64323ebfe.png", "https://i.ibb.co/4w47SMVJ/COYORA-fw25-26-6.jpg", "https://i.ibb.co/9mMCyGdB/COYORA-fw25-26-7-1.jpg"] 
    },
    { 
      name: "Coyora SS/26 Collection", 
      year: "2026", 
      concept: "A return to nature, utilizing sustainable materials and organic forms.",
      process: "Sourced materials from local artisans and focused on zero-waste pattern making.",
      credits: "Design: Ramazan Habibov\nPhotography: Elena M.",
      images: ["https://i.ibb.co/ycmJ46JY/coyora-ss26-1.jpg", "https://i.ibb.co/35yPmnpQ/0efd0abd-ffcf-4886-adf6-b9f0521aeb7a.jpg", "https://i.ibb.co/Q7SQFrRv/coyora-ss26-2.jpg" , "https://i.ibb.co/cKzxyZhq/COYORA-ORIGINAL4.jpg","https://i.ibb.co/VWXvhXWt/COYORA-ORIGINAL2.jpg", "https://i.ibb.co/JRT0vmsY/COYORA-ORIGINAL1.jpg", "https://res.cloudinary.com/dxnrmskvb/image/upload/v1776279950/ADY05273_duv5g8.jpg"] 
    },
  ],
  event: [
    { 
      name: "Azerbaijan Fashion Week", 
      year: "2025",
      concept: "Immersive stage design focusing on light and shadow to highlight the collections.",
      process: "Collaborated with lighting engineers to create dynamic, responsive environments.",
      credits: "Production: Coyora Studio\nLighting: Luma Tech",
      images: ["https://i.ibb.co/Q35mpb6F/poster.jpg", "https://i.ibb.co/PdWfqcf/1764678299540.jpg", "https://i.ibb.co/RkdZvpZj/newspic.jpg", "https://i.ibb.co/rrSZkmM/AFW-Smm-press.webp", "https://i.ibb.co/394qsCcR/17010979274371949978-1200x630.jpg", "https://i.ibb.co/gbW2pRMn/AFW-poster.jpg"] 
    },
    { 
      name: "Azerbaijan Fashion Forward contest", 
      year: "2024",
      concept: "A platform to showcase emerging talent with a minimalist, modern aesthetic.",
      process: "Designed the entire visual identity and spatial layout for the event.",
      credits: "Art Direction: Ramazan Habibov",
      images: ["https://i.ibb.co/ch2tf86S/Whats-App-2023-12-15-17-40-52-37974692.jpg", "https://i.ibb.co/xq9Xc8Br/2.jpg", "https://i.ibb.co/QFfCYWbG/614585ca-1da9-4a5d-bb3a-996b85490cc1.jpg"] 
    },
    { 
      name: "Turkiye Fashion Week", 
      year: "2025",
      concept: "Bridging cultures through fashion, with a stage design inspired by historical motifs.",
      process: "Extensive research into regional architecture to inform the set design.",
      credits: "Set Design: Coyora Studio",
      images: ["https://i.ibb.co/1tnznv1R/fashion-week-turkiye-fwtr-azerbaijan-2025-20251161616148fd0b1d36edb4eb98f2347342e29a317.jpg"] 
    },
    { 
      name: "International Gurama Fest", 
      year: "2023",
      concept: "Celebrating traditional crafts in a contemporary setting.",
      process: "Curated exhibition spaces that allowed for interactive craft demonstrations.",
      credits: "Exhibition Design: Coyora Studio",
      images: ["https://i.ibb.co/277QZWbq/guramafest.jpg"] 
    },
    { 
      name: "Yeriyən Düşüncə", 
      year: "2024",
      concept: "An experimental art exhibition exploring the concept of 'walking thought'.",
      process: "Created a labyrinthine layout to encourage wandering and discovery.",
      credits: "Spatial Design: Ramazan Habibov",
      images: ["https://i.ibb.co/v6tk0q9n/1706269799-1.jpg", "https://i.ibb.co/d0VmNXdS/1713284017.jpg" ] 
    }
  ],
  graphic: [
    { 
      name: "BIG MODEL AGENCY", 
      year: "2024",
      concept: "A bold, typographic identity reflecting the agency's modern approach.",
      process: "Developed a custom typeface and a comprehensive brand guidelines document.",
      credits: "Graphic Design: Coyora Studio",
      images: ["https://i.ibb.co/S4fsjN48/8451.jpg", "https://i.ibb.co/WpR7KCNt/bgmdkids-page-0001.jpg", "https://i.ibb.co/r8Xyvvx/bra-ur-2-page-0001.jpg"] 
    },
    { 
      name: "FELICIA BATUMI", 
      year: "2023",
      concept: "Elegant and sophisticated branding for a luxury real estate project.",
      process: "Focused on high-end print materials and a refined digital presence.",
      credits: "Art Direction: Ramazan Habibov",
      images: ["https://i.ibb.co/w16498Q/0007.jpg", "https://i.ibb.co/cKf8zwzQ/0001.jpg", "https://i.ibb.co/6cWdjt28/0003.jpg"] 
    },
    { 
      name: "PROJECT #1", 
      year: "2024",
      concept: "Experimental poster series exploring generative design techniques.",
      process: "Utilized custom algorithms to generate unique visual patterns.",
      credits: "Design & Code: Coyora Studio",
      images: ["https://i.ibb.co/HTjwnQyf/2.jpg", "https://i.ibb.co/Myw6T7vz/3.jpg", "https://i.ibb.co/KxLDJbSf/4.jpg", "https://i.ibb.co/qMSpVd63/1-1.jpg", "https://i.ibb.co/FbmjXCbC/5.jpg"] 
    },
  ],
  web: [
    { 
      name: "BIG MODEL DATABASE", 
      year: "2024",
      concept: "A comprehensive, easily searchable database for talent management.",
      process: "Built with a focus on performance and intuitive user experience.",
      credits: "Development: Coyora Studio",
      link: "https://bigmodeldatabase.vercel.app/", 
      images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920"] 
    },
    { 
      name: "PLS.AZ", 
      year: "2023",
      concept: "A sleek, modern e-commerce platform for a boutique fashion brand.",
      process: "Integrated seamless payment gateways and dynamic product displays.",
      credits: "Design & Dev: Ramazan Habibov",
      link: "https://pls.az/", 
      images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920"] 
    },
    { 
      name: "VCONT", 
      year: "2024",
      concept: "A portfolio website for a creative agency, featuring smooth animations.",
      process: "Utilized WebGL for interactive background elements.",
      credits: "Creative Direction: Coyora Studio",
      link: "https://vcont.vercel.app/", 
      images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1920"] 
    }
  ]
};

const defaultContact = {
  email: 'coyoraofficial@gmail.com',
  phone: '+994552739521',
  address: 'Baku, Azerbaijan',
  instagram: 'https://www.instagram.com/_romagabibov_/',
  linkedin: 'https://www.linkedin.com/in/ramazanhabibov/',
  website: 'https://coyoraoriginal.tilda.ws/',
  telegram: 'https://t.me/Romagabibov',
  whatsapp: 'http://wa.me/994552739521',
  formspreeId: 'mwvapwke',
  footerWebsiteUrl: 'https://coyoraoriginal.tilda.ws/',
  googleDriveScriptUrl: 'https://script.google.com/macros/s/AKfycbx3WCgzY9ZxiwlogLpuROsZ5yjdaI13bfVOgJxOkSrBCPCbjIFK3smgGpQDA4EfUQ4PzA/exec'
};

const defaultPressData: PressItem[] = [
  { year: '2026', title: 'The Future of Digital Fashion', publication: 'Vogue Tech', link: '#' },
  { year: '2025', title: 'Immersive Event Design Trends', publication: 'Design Week', link: '#' },
  { year: '2025', title: 'Minimalism in Web Experiences', publication: 'Awwwards', link: '#' }
];

const defaultLabData: LabItem[] = [
  {
    id: '001',
    title: 'Generative Study 1',
    image: 'https://picsum.photos/seed/lab1/800/800',
    description: 'Exploring algorithmic patterns in textile design.',
    experiments: [
      { name: 'Noise Algorithms', desc: 'Using Perlin noise to generate organic fabric textures.' },
      { name: 'Parametric Forms', desc: 'Creating 3D printable accessories based on mathematical equations.' }
    ]
  },
  {
    id: '002',
    title: 'Generative Study 2',
    image: 'https://picsum.photos/seed/lab2/800/800',
    description: 'Interactive light installations for immersive spaces.',
    experiments: [
      { name: 'Reactive LED Arrays', desc: 'Programming LEDs to respond to ambient sound frequencies.' },
      { name: 'Shadow Mapping', desc: 'Using projectors to alter the perception of physical architecture.' }
    ]
  },
  {
    id: '003',
    title: 'Generative Study 3',
    image: 'https://picsum.photos/seed/lab3/800/800',
    description: 'Web-based interactive 3D experiences.',
    experiments: [
      { name: 'WebGL Shaders', desc: 'Custom GLSL shaders for real-time visual distortions.' },
      { name: 'Physics Simulations', desc: 'Simulating cloth and soft body dynamics in the browser.' }
    ]
  },
  {
    id: '004',
    title: 'Generative Study 4',
    image: 'https://picsum.photos/seed/lab4/800/800',
    description: 'Experimental typography and kinetic text.',
    experiments: [
      { name: 'Variable Fonts', desc: 'Animating font weight and width based on scroll position.' },
      { name: 'Kinetic Layouts', desc: 'Text that reacts to cursor movement and velocity.' }
    ]
  }
];

const defaultVolunteerFormConfig: VolunteerFormConfig = {
  title: "BECOME A VOLUNTEER",
  description: "Please fill out the form below."
};

const defaultVacanciesFormConfig: VolunteerFormConfig = {
  title: "VACANCIES",
  description: "Information about upcoming vacancies will be posted here."
};

const defaultInternshipsFormConfig: VolunteerFormConfig = {
  title: "INTERNSHIP",
  description: "Information about upcoming internships will be posted here."
};

const defaultCollaboratorsData: Collaborator[] = [
  { name: 'Azerbaijan Fashion Week', url: '#' },
  { name: 'MBFW AZERBAIJAN', url: '#' },
  { name: 'Big Model Agency', url: '#' },
  { name: 'Debet Safety', url: '#' },
  { name: 'VCONT', url: '#' }
];

const defaultAboutData: AboutData = {
  image: 'https://res.cloudinary.com/dxnrmskvb/image/upload/v1776279950/ADY05273_duv5g8.jpg'
};

const defaultBrandingData: BrandingData = {
  logoUrl: '',
  faviconUrl: '',
  ogImageUrl: ''
};

const getInitialLang = (): 'en' | 'ru' | 'az' => {
  if (typeof navigator !== 'undefined') {
    const l = navigator.language.toLowerCase();
    if (l.startsWith('ru')) return 'ru';
    if (l.startsWith('az')) return 'az';
  }
  return 'en';
};

export const useSiteStore = create<SiteData>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: getInitialLang(),
      branding: defaultBrandingData,
      translations: defaultTranslations,
      aboutData: defaultAboutData,
      portfolioData: defaultPortfolioData,
      pressData: defaultPressData,
      labData: defaultLabData,
      collaboratorsData: defaultCollaboratorsData,
      formSchemas: [],
      volunteerFormConfig: defaultVolunteerFormConfig,
      vacanciesFormConfig: defaultVacanciesFormConfig,
      internshipsFormConfig: defaultInternshipsFormConfig,
      contact: defaultContact,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      updateTranslations: (lang, key, value) => set((state) => ({
        translations: {
          ...state.translations,
          [lang]: {
            ...state.translations[lang],
            [key]: value
          }
        }
      })),
      updatePortfolio: (category, index, project) => set((state) => {
        const newCategory = [...state.portfolioData[category]];
        newCategory[index] = project;
        return { portfolioData: { ...state.portfolioData, [category]: newCategory } };
      }),
      addProject: (category, project) => set((state) => ({
        portfolioData: {
          ...state.portfolioData,
          [category]: [...state.portfolioData[category], project]
        }
      })),
      removeProject: (category, index) => set((state) => {
        const newCategory = [...state.portfolioData[category]];
        newCategory.splice(index, 1);
        return { portfolioData: { ...state.portfolioData, [category]: newCategory } };
      }),
      updatePress: (index, item) => set((state) => {
        const newPress = [...state.pressData];
        newPress[index] = item;
        return { pressData: newPress };
      }),
      addPress: (item) => set((state) => ({
        pressData: [...state.pressData, item]
      })),
      removePress: (index) => set((state) => {
        const newPress = [...state.pressData];
        newPress.splice(index, 1);
        return { pressData: newPress };
      }),
      updateLab: (index, item) => set((state) => {
        const newLab = [...state.labData];
        newLab[index] = item;
        return { labData: newLab };
      }),
      addLab: (item) => set((state) => ({
        labData: [...state.labData, item]
      })),
      removeLab: (index) => set((state) => {
        const newLab = [...state.labData];
        newLab.splice(index, 1);
        return { labData: newLab };
      }),
      updateContact: (key, value) => set((state) => ({
        contact: { ...state.contact, [key]: value }
      })),
      updateBranding: (branding) => set({ branding }),
      updateCollaborators: (collaborators) => set({ collaboratorsData: collaborators }),
      updateAboutData: (data) => set({ aboutData: data }),
      addFormSchema: (schema) => set((state) => ({
        formSchemas: [...state.formSchemas, schema]
      })),
      updateFormSchema: (id, schema) => set((state) => ({
        formSchemas: state.formSchemas.map(s => s.id === id ? schema : s)
      })),
      removeFormSchema: (id) => set((state) => ({
        formSchemas: state.formSchemas.filter(s => s.id !== id)
      })),
      updateVolunteerFormConfig: (config) => set({ volunteerFormConfig: config }),
      updateVacanciesFormConfig: (config) => set({ vacanciesFormConfig: config }),
      updateInternshipsFormConfig: (config) => set({ internshipsFormConfig: config }),
      reset: () => set({
        translations: defaultTranslations,
        aboutData: defaultAboutData,
        portfolioData: defaultPortfolioData,
        pressData: defaultPressData,
        labData: defaultLabData,
        formSchemas: [],
        volunteerFormConfig: defaultVolunteerFormConfig,
        vacanciesFormConfig: defaultVacanciesFormConfig,
        internshipsFormConfig: defaultInternshipsFormConfig,
        contact: defaultContact
      }),
      resetSection: (section) => set((state) => {
        switch(section) {
          case 'translations': return { translations: defaultTranslations };
          case 'about': return { aboutData: defaultAboutData };
          case 'portfolio': return { portfolioData: defaultPortfolioData };
          case 'press': return { pressData: defaultPressData };
          case 'lab': return { labData: defaultLabData };
          case 'contact': return { contact: defaultContact };
          case 'collaborators': return { collaboratorsData: defaultCollaboratorsData };
          case 'branding': return { branding: defaultBrandingData };
          case 'forms': return { 
            volunteerFormConfig: defaultVolunteerFormConfig,
            vacanciesFormConfig: defaultVacanciesFormConfig,
            internshipsFormConfig: defaultInternshipsFormConfig
          };
          default: return {};
        }
      })
    }),
    {
      name: 'coyora-site-storage',
      merge: (persistedState: any, currentState: SiteData) => {
        return {
          ...currentState,
          ...persistedState,
          translations: {
            en: { ...currentState.translations.en, ...(persistedState.translations?.en || {}) },
            ru: { ...currentState.translations.ru, ...(persistedState.translations?.ru || {}) },
            az: { ...currentState.translations.az, ...(persistedState.translations?.az || {}) },
          },
          contact: {
            ...currentState.contact,
            ...(persistedState.contact || {})
          },
          volunteerFormConfig: {
            ...currentState.volunteerFormConfig,
            ...(persistedState.volunteerFormConfig || {})
          },
          vacanciesFormConfig: {
            ...currentState.vacanciesFormConfig,
            ...(persistedState.vacanciesFormConfig || {})
          },
          internshipsFormConfig: {
            ...currentState.internshipsFormConfig,
            ...(persistedState.internshipsFormConfig || {})
          },
          portfolioData: {
            ...currentState.portfolioData,
            ...(persistedState.portfolioData || {})
          }
        };
      }
    }
  )
);

// Subscribe to store changes to update global language
useSiteStore.subscribe((state: SiteData) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = state.lang || 'en';
  }
});
// Set initial run if document is defined
if (typeof document !== 'undefined') {
  document.documentElement.lang = useSiteStore.getState().lang || 'en';
}
