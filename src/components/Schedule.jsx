// client/src/components/Schedule.js
import { useState, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '../firebase';
import { userService, scheduleService } from '../services/api';

export default function Schedule() {
  // Mövcud işlənən funksiyalar
  const determineCurrentWeek = () => {
    const semesterStartDate = new Date('2025-04-21');
    const currentDate = new Date();
    const weekDiff = Math.floor((currentDate - semesterStartDate) / (7 * 24 * 60 * 60 * 1000));
    return weekDiff % 2 === 0 ? 'alt' : 'ust';
  };

  // Current day function
  const getCurrentDay = () => {
    const days = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
    return days[new Date().getDay()];
  };

  // Weekend check function
  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 1  // 0 is Sunday, 6 is Saturday
  };

  // Mövcud state-lər
  const [activeWeek, setActiveWeek] = useState(determineCurrentWeek());
  const [currentWeekType, setCurrentWeekType] = useState(determineCurrentWeek());
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  
  // Yeni state-lər
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [showNotification, setShowNotification] = useState(false);

  // İstifadəçi məlumatlarını və bildiriş statusunu yoxlayırıq
  useEffect(() => {
    // LocalStorage-dən istifadəçi məlumatlarını alırıq
    const savedUser = localStorage.getItem('scheduleAppUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserEmail(user.email || '');
      setUserName(user.name || '');
      
      // Email varsa bildirişləri aktiv hesab edirik
      if (user.email) {
        setNotificationsEnabled(true);
        console.log('Notifications enabled for email:', user.email);
        
        // Serverdə qeydiyyatı yeniləyirik - lakin əvvəlcə device token alırıq
        requestNotificationPermission()
          .then(token => {
            registerUserWithEmailAndToken(user.email, user.name, token);
          })
          .catch(err => {
            // Token ala bilməsək də, yalnız email ilə qeydiyyat edirik
            registerUserWithEmailAndToken(user.email, user.name, null);
            console.warn('Could not get notification token, using email only:', err);
          });
      } else {
        setNotificationsEnabled(false);
        setShowUserForm(true);
      }
    } else {
      // İstifadəçi qeydiyyatdan keçməyibsə, formu göstəririk
      setShowUserForm(true);
      setNotificationsEnabled(false);
    }
  
    // İlkin həftə tipini təyin edirik
    setCurrentWeekType(determineCurrentWeek());
  
    // Həftə tipini gündəlik yoxlayırıq
    const checkInterval = setInterval(() => {
      setCurrentWeekType(determineCurrentWeek());
    }, 1000 * 60 * 60 * 12); // 12 saatdan bir
  
    // Ön planda olarkən bildirişləri dinləyirik (Firebase üçün)
    const unsubscribeFn = onMessageListener()
      .then((payload) => {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body,
        });
        setShowNotification(true);
  
        // 5 saniyə sonra bildirişi bağlayırıq
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return () => {}; // dummy unsubscribe
      })
      .catch((err) => {
        console.error("Failed to listen for messages:", err);
        return () => {};
      });
  
    return () => {
      clearInterval(checkInterval);
      if (typeof unsubscribeFn === "function") {
        unsubscribeFn();
      }
    };
  }, []);
  
  // İstifadəçini email və token ilə qeydiyyat edir
  const registerUserWithEmailAndToken = async (email, name, deviceToken) => {
    if (!email) return;
    
    try {
      // İstifadəçini serverə qeydiyyata alırıq
      await userService.registerUser({
        name: name || 'Tələbə',
        email: email,
        deviceToken: deviceToken // token olmasa da null olaraq göndəririk
      });
      
      // İstifadəçi məlumatlarını yadda saxlayırıq
      localStorage.setItem('scheduleAppUser', JSON.stringify({
        name: name || 'Tələbə',
        email: email
      }));
      
      console.log('User registered for notifications:', email);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  // Schedule data fetch effect
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        const response = await scheduleService.getAllSchedules();
        
        // Response formatını düzəldirik
        if (response && response.success && response.data) {
          // Scheduleı week və day üzrə strukturlaşdırırıq
          const formattedData = {
            alt: {},
            ust: {}
          };
          
          response.data.forEach(item => {
            if (!formattedData[item.weekType][item.day]) {
              formattedData[item.weekType][item.day] = item.lessons;
            }
          });
          
          setScheduleData(formattedData);
        }
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, []);

  // İstifadəçi qeydiyyatını təsdiqləmək
  const handleSubmitUserForm = async (e) => {
    e.preventDefault();
    
    if (!userEmail) {
      alert('Email daxil etməlisiniz');
      return;
    }
    
    try {
      // Əvvəlcə Firebase token almağa çalışırıq (browser bildirişləri üçün)
      let deviceToken = null;
      try {
        deviceToken = await requestNotificationPermission();
      } catch (err) {
        console.warn('Could not get notification permission:', err);
        // Token ala bilməsək də davam edirik - email yetərlidir
      }
      
      // İstifadəçini qeydiyyat edirik
      await registerUserWithEmailAndToken(userEmail, userName, deviceToken);
      
      // Bildirişləri aktiv edirik
      setNotificationsEnabled(true);
      setShowUserForm(false);
      
      alert('Bildirişlər uğurla aktivləşdirildi! Dərs cədvəli haqqında bildirişlər email vasitəsilə göndəriləcək.');
    } catch (error) {
      console.error('Error registering for notifications:', error);
      alert('Bildirişləri aktivləşdirərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  };

  // Bildirişləri aktivləşdirmək üçün düymə tıklanması
  const enableNotifications = () => {
    if (!notificationsEnabled) {
      setShowUserForm(true);
    } else {
      // Bildirişlər artıq aktivdir, istifadəçiyə bildiririk
      alert(`Bildirişlər ${userEmail} email ünvanı üçün artıq aktivdir.`);
    }
  };

  // Day selector buttons
  const getDayButtons = () => {
    const days = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar'];
    
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1 rounded-md font-medium ${
              selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    );
  };

  // Render schedule for selected day/week
  const renderSchedule = () => {
    if (loading) {
      return <div className="text-center py-8">Yüklənir...</div>;
    }

    // Seçilmiş həftə və gün üzrə dərslər
    const dayLessons = scheduleData[activeWeek]?.[selectedDay] || [];
    
    if (!dayLessons || dayLessons.length === 0) {
      return (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          Bu gün üçün dərs cədvəli tapılmadı
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {dayLessons.map((lesson, index) => {
          // "Dərs yoxdur" yazısı varsa və zaman göstərilməyibsə
          if (lesson.subject === "Dərs yoxdur" && (!lesson.time || lesson.time === "")) {
            return (
              <div key={index} className="border rounded-lg p-4 bg-gray-50 text-center">
                <h3 className="text-lg font-bold">Dərs yoxdur</h3>
              </div>
            );
          }
          
          // Dərs varsa
          const [startTime, endTime] = lesson.time ? lesson.time.split('-') : ['', ''];
          
          return (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between">
                <span className="font-medium">{startTime} - {endTime}</span>
                <span className="text-blue-600 font-medium">{lesson.room}</span>
              </div>
              <h3 className="text-lg font-bold mt-1">{lesson.subject}</h3>
              {lesson.teacher && <p className="text-gray-600">{lesson.teacher}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  // JSX olaraq qaytarılacaq komponent
  return (
    <div className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-center mb-4">Universitet Dərs Cədvəli</h1>
      
      {/* Bildiriş göstəricisi */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <h4 className="font-bold">{notification.title}</h4>
          <p className="whitespace-pre-line">{notification.body}</p>
        </div>
      )}
      
      {/* İstifadəçi qeydiyyat formu */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Dərs Bildirişlərini Aktivləşdirin</h2>
            <p className="mb-4">Dərs cədvəli haqqında bildirişlər almaq üçün email adresinizi daxil edin.</p>
            
            <form onSubmit={handleSubmitUserForm}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Adınız (istəyə bağlı)</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Adınızı daxil edin"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email adresiniz *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Email adresinizi daxil edin"
                  required
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Bildirişləri Aktivləşdir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="text-lg font-medium mb-3 md:mb-0">
          <span className="text-gray-600">Bugün: </span>
          {new Date().toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}
          {getCurrentDay() && ` - ${getCurrentDay()}`}
          {isWeekend() && " - Həftə sonu"}
        </div>
        
        {/* Bildiriş aktivləşdirmə düyməsi */}
        <div className="flex space-x-4">
          <button 
            onClick={enableNotifications}
            className={`px-4 py-2 rounded-md ${notificationsEnabled ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'}`}
          >
            {notificationsEnabled ? 
              `Bildirişlər Aktivdir (${userEmail})` : 
              'Bildirişləri Aktivləşdir'
            }
          </button>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6 justify-center">
        <button 
          className={`px-4 py-2 rounded-md font-medium ${activeWeek === 'alt' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveWeek('alt')}
        >
          Alt Həftə {currentWeekType === 'alt' ? '(Cari)' : ''}
        </button>
        <button 
          className={`px-4 py-2 rounded-md font-medium ${activeWeek === 'ust' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveWeek('ust')}
        >
          Üst Həftə {currentWeekType === 'ust' ? '(Cari)' : ''}
        </button>
      </div>
      
      {/* Gün seçimi */}
      {getDayButtons()}
      
      {/* Seçilmiş gün/həftə üçün cədvəli göstəririk */}
      {renderSchedule()}
      
      {/* Əlavə bildiriş məlumatı */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-lg mb-2">Bildirişlər Haqqında</h3>
        <p>Bildirişləri aktivləşdirdiyiniz halda:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>Hər gün axşam saat 23:51-də növbəti günün dərs cədvəli haqqında email alacaqsınız.</li>
          <li>Hər dərsdən 15 dəqiqə əvvəl bildiriş email vasitəsilə göndəriləcək.</li>
          <li>Bildirişlər almaq üçün tətbiqi açıq saxlamağa ehtiyac yoxdur.</li>
        </ul>
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        Son yenilənmə: {new Date().toLocaleString('az-AZ')}
      </div>
    </div>
  );
}