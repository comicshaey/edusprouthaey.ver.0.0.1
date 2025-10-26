// annual-leave/script.js
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s)); const $=(s,c=document)=>c.querySelector(s);
function fmt(n,d=2){ if(n===null||isNaN(n)) return ''; return new Intl.NumberFormat('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n) }
function fmt0(n){ return new Intl.NumberFormat('ko-KR').format(Math.round(n)) }

function monthsWorkedInYear(hire, year){
  // count full months within 'year' from hire date
  const start = new Date(hire); if(isNaN(start)) return 0;
  const y=Number(year);
  const yearStart = new Date(y,0,1);
  const yearEnd = new Date(y,11,31);
  const effStart = start > yearStart ? start : yearStart;
  let months=0;
  let cur = new Date(effStart.getFullYear(), effStart.getMonth(), 1);
  while(cur <= yearEnd){
    // if hired before or on last day of this month
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth()+1, 0);
    if(start <= monthEnd) months += 1;
    cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1);
  }
  return months;
}

function calcBaseDays(hireDate, year){
  // Simplified reference rule: first (hire) year: 1 day per month; second and later: 15
  const hire = new Date(hireDate);
  if(isNaN(hire)) return 0;
  const y = Number(year);
  if(hire.getFullYear() === y){ return monthsWorkedInYear(hire, y); }
  // year after hire or later
  return 15;
}

function calcSeniorityDays(hireDate, year){
  const hire = new Date(hireDate); if(isNaN(hire)) return 0;
  const y = Number(year);
  const years = Math.max(0, y - hire.getFullYear()); // rough
  if(years < 2) return 0;
  // every 2 years after 2nd year add 1 (cap at 25 total is common, but we don't hard-cap here)
  return Math.floor((years - 1)/2);
}

function recalc(){
  const hireDate = $('#hireDate').value;
  const year = $('#year').value;
  const base = calcBaseDays(hireDate, year);
  const senior = calcSeniorityDays(hireDate, year);
  $('#baseDays').value = fmt(base,0);
  $('#seniorityDays').value = fmt(senior,0);
  const autoTotal = base + senior;
  $('#autoTotal').value = fmt(autoTotal,0);

  const adjB = parseFloat($('#adjBase').value||0);
  const adjS = parseFloat($('#adjSenior').value||0);
  const finalDays = autoTotal + adjB + adjS - (parseFloat($('#deductDays').value||0));
  $('#finalDays').value = fmt(finalDays, 1);

  const ow = parseFloat($('#ordinaryWage').value||0);
  const hpd = parseFloat($('#hoursPerDay').value||8);
  const unused = parseFloat($('#unusedDays').value||0);
  $('#payout').value = fmt0(ow * hpd * unused);
}

function exportExcel(){
  const rows = [['공무직 연차유급휴가/연차수당 계산서'],['항목','값'],
    ['성명',$('#name').value],['입사일',$('#hireDate').value],['기준연도',$('#year').value],
    ['주 소정근로시간',$('#weeklyHours').value],['상시근무 여부',$('#isFull').value],
    ['기본 연차(자동)',$('#baseDays').value],['근속 가산(자동)',$('#seniorityDays').value],['총 부여(자동)',$('#autoTotal').value],
    ['보정(기본)',$('#adjBase').value],['보정(근속)',$('#adjSenior').value],['차감(결근 등)',$('#deductDays').value],['최종 부여',$('#finalDays').value],
    ['통상임금(시급)',$('#ordinaryWage').value],['1일 근로시간',$('#hoursPerDay').value],['미사용 연차',$('#unusedDays').value],['예상 연차수당',$('#payout').value]
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '연차/연차수당');
  XLSX.writeFile(wb, 'annual_leave_calc.xlsx');
}

function init(){
  ['hireDate','year','weeklyHours','isFull','deductDays','adjBase','adjSenior','ordinaryWage','hoursPerDay','unusedDays','name'].forEach(id=>{
    $('#'+id).addEventListener('input', recalc);
    $('#'+id).addEventListener('change', recalc);
  });
  recalc();
  $('#exportExcel').addEventListener('click', exportExcel);
}
document.addEventListener('DOMContentLoaded', init);
