import * as React from 'react';
import moment from 'moment'
import { Radio } from 'antd';
import queryString from 'query-string'
import './Gym.css'

const slots = [
  '06:30 - 07:50', '08:05 - 09:25', '09:40 - 11:00', '11:15 - 12:35',
  '12:50 - 14:10', '14:25 - 15:45', '16:00 - 17:20', '17:35 - 19:00'
]

const server = 'https://masosoft.top/gymbooking'
const gymServer = 'http://gymbooking.ge.com.cn'

const Gym = props => {
  const [user, setUser] = React.useState(null)
  const [update, setUpdate] = React.useState(0)
  const [reserved, setReserved] = React.useState([])
  const onClick = () => {
    document.querySelector("input[placeholder='sso'").select()
    document.execCommand(`copy`, false)
    window.location.href = `${gymServer}/gym.html`
  }
  return (
    <div style={{ maxWidth: '414px' }}>
      <h2 style={{ textAlign: 'center' }}>Gym Revervation</h2>
      <UserInfo onChange={setUser} />
      <ReservedList user={user} onChange={setReserved} update={update} />
      <ReserveForm user={user} reserved={reserved} onChange={() => setUpdate(update + 1)} />
      <div style={{ textAlign: 'center', color: 'darkblue', marginTop: '20px' }} onClick={onClick}>Copy SSO → Gym Site</div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}><a href={`${gymServer}/gym.html`}>Go Gym Site</a></div>
    </div>
  )
}

const UserInfo = props => {
  const [name, setName] = React.useState('')
  const [sso, setSso] = React.useState('')
  const [mobile, setMobile] = React.useState('')

  const eventSetName = e => setName(e.target.value)
  const eventSetSso = e => setSso(e.target.value)
  const eventSetMobile = e => setMobile(e.target.value)

  const load = () => {
    const userinfo = localStorage.getItem('userinfo') 
      ? JSON.parse(localStorage.getItem('userinfo')) 
      : queryString.parse(window.location.search)
    userinfo.name && setName(userinfo.name)
    userinfo.sso && setSso(userinfo.sso)
    userinfo.mobile && setMobile(userinfo.mobile)
    props.onChange(userinfo)
  }

  const save = () => {
    if (sso && name && mobile) {
      localStorage.setItem('userinfo', JSON.stringify({ name, sso, mobile }))
      const url = queryString.stringify({ sso, name, mobile})
      window.history.pushState(null, '', `${window.location.pathname}?${url}`)
    }
    props.onChange({ name, sso, mobile })
  }

  React.useEffect(() => {
    console.log(props)
    load()
  }, [])

  return (
    <React.Fragment>
      <div className="user">
        <input placeholder="name" value={name} onChange={eventSetName}></input>
        <input placeholder="sso" value={sso} onChange={eventSetSso}></input>
        <input placeholder="mobile" style={{ minWidth: '115px' }} value={mobile} onChange={eventSetMobile}></input>
        <button onClick={save}>保存</button>
      </div>
      <div className="hint">建议保存用户信息后再收藏地址</div>
    </React.Fragment>
  )
}

const ReservedList = props => {
  const { user, onChange, update } = props
  const [list, setList] = React.useState([])
  const [message, setMessage] = React.useState('')

  const load = async () => {
    if (user && user.sso) {
      const res = await fetch(`${server}/api/v1/getLastGymRegFormsBySSO?sso=${user.sso}`)
      const { data } = await res.json()
      data.sort((a, b) => moment(a.reg_date, 'YYYY-MM-DD') - moment(b.reg_date, 'YYYY-MM-DD'))
      setList(data)
      onChange(data)
    }
  }

  const cancel = async () => {
    const regIds = list.filter(item => item.checked).map(item => item.reg_id)
    if (regIds.length > 0) {
      const res = await fetch(`${server}/api/v1/cancelGymRegList`, {
        method: 'POST',
        body: JSON.stringify(regIds.map(reg_id => ({ reg_id })))
      })
      const { errorMessage, result } = await res.json()
      setMessage(errorMessage || result)
      load()
    }
  }

  const onCheck = e => {
    const regItem = list.find(item => item.reg_id === e.target.value)
    if (regItem) {
      regItem.checked = e.target.checked
    }
    setList(list)
  }

  React.useEffect(() => {
    load()
  }, [user, update])

  return (
    <div className="reserved">
      <h4 style={{ textAlign: 'center' }}>已预约</h4>
      {Array.isArray(list) && list.length > 0
        ? list.map(item => {
          return (
            <div key={item.reg_id} className="reserved-item">
              <div><input key={item.reg_id} type="checkbox" value={item.reg_id} onChange={onCheck} checked={item.checked}></input></div>
              <div>Date: {item.reg_date}</div>
              <div>Time: {item.reg_schedule_detail}</div>
            </div>
          )
        })
        : <div>无预约</div>
      }
      <button onClick={cancel}>取消预约</button>
      <div className="message">{message}</div>
    </div>
  )
}

const ReserveForm = props => {
  const { user, reserved, onChange } = props
  const [loading, setLoading] = React.useState(false)
  const [posting, setPosting] = React.useState(false)
  const [date, setDate] = React.useState('')
  const [recent, setRecent] = React.useState([])
  const [available, setAvailable] = React.useState({})
  const [message, setMessage] = React.useState('')
  const [schedule, setSchedule] = React.useState(1)
  const next_days = 5

  React.useEffect(() => {
    setToday()
    getRecent()
  }, [])

  const getRecent = () => {
    for (let i = 0; i < next_days; i++) {
      const day = moment().add(i, 'days').format('YYYY-MM-DD')
      recent.push(day)
      setRecent(recent)
    }
  }

  const setToday = () => {
    const today = moment().format('YYYY-MM-DD')
    console.log('setToday', today)
    setDate(today)
  }

  const onChangeSchedule = e => {
    setSchedule(e.target.value)
  }

  const onChangeDate = e => {
    console.log(e.target.value)
    setDate(e.target.value)
  }

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  const submit = async () => {
    if (user && user.sso && user.name && user.mobile) {
      const res = await fetch(`${server}/api/v1/createGymRegForm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_date: date,
          reg_schedule_id: schedule,
          "reg_ssoid": user.sso,
          "reg_username": user.name,
          "reg_mobile": user.mobile,
          "reg_status": true
        })
      })

      const { errorMessage, result } = await res.json()
      setMessage(errorMessage || result)
      if (result === 'done') {
        onChange()
      }
    }
  }

  const getAvailable = async () => {
    setLoading(true)
    available[date] = []
    setAvailable(available)

    const cancel = async (sso) => {
      let res = await fetch(`${server}/api/v1/getLastGymRegFormsBySSO?sso=${sso}`)
      let { data } = await res.json()
      let reversed = data.find(item => item.reg_date === date)
      if (reversed?.reg_id) {
        res = await fetch(`${server}/api/v1/cancelGymRegList`, {
          method: 'POST',
          body: JSON.stringify([{ reg_id: reversed?.reg_id }])
        })
        await res.json()
      }
    }

    const reg = async (reg_schedule_id, status) => {
      const randSSO = "21" + Math.random().toString().slice(-7)
      const res = await fetch(`${server}/api/v1/createGymRegForm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_date: date,
          reg_schedule_id,
          "reg_ssoid": randSSO,
          "reg_username": "   ",
          "reg_mobile": randMobile(),
          "reg_status": true
        })
      })

      const { errorMessage, result } = await res.json()
      if (result === 'done') {
        status.push(reg_schedule_id)
        await cancel(randSSO)
      }

      if (reg_schedule_id < 8) {
        await reg(reg_schedule_id + 1, status)
      }
    }
    const reserveStatus = []
    await reg(1, reserveStatus)
    available[date] = reserveStatus

    setAvailable(available)

    setLoading(false)
  }

  const quickReg = async () => {
    setPosting(true)
    const reg = async (day, reg_schedule_id) => {
      const res = await fetch(`${server}/api/v1/createGymRegForm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_date: day,
          reg_schedule_id: reg_schedule_id.toString(),
          "reg_ssoid": user.sso,
          "reg_username": user.name,
          "reg_mobile": user.mobile,
          "reg_status": true
        })
      })

      const { errorMessage, result } = await res.json()
      if (result === 'done') {
        return true
      } else if (reg_schedule_id < 8) {
        await reg(day, reg_schedule_id + 1)
      }
    }

    for (const day of recent) {
      const status = localStorage.getItem(`gym_${day}`)
      if (!reserved.find(item => item.reg_date === day) && status === "true") {
        const success = await reg(day, 1)
        if (success) {
          window.location.reload()
          break
        }
      }
    }
    setPosting(true)
  }

  return (
    <div className="reserve-form">
      <h4 style={{ textAlign: 'center' }}>进行预约</h4>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <div>日期: <input type="date" value={date} onChange={onChangeDate} style={{ display: 'inline-block' }}></input></div>
          <Radio.Group onChange={onChangeDate} value={date}>
            {recent.map(day => <Day key={day} value={day} style={radioStyle} reserved={reserved} />)}
          </Radio.Group>
        </div>
        <div>
          <div style={{ height: '26px', lineHeight: '26px' }}>时段:
            {loading
              ? ' 查询中...'
              : <button onClick={getAvailable}>刷新可用</button>
            }
          </div>
          <Radio.Group onChange={onChangeSchedule} value={schedule}>
            {slots.map((slot, i) => {
              const idle = available[date]
                ? available[date].includes(i + 1) ? '可用' : ''
                : ''
              return <Radio key={slot} style={radioStyle} value={i + 1}>{slot} {idle}</Radio>
            })}
          </Radio.Group></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {/* {posting ? '执行中...' : <button onClick={quickReg} style={{ display: 'block' }}>快速预约</button>} */}
        <button onClick={submit} style={{ display: 'block' }}>预约</button>
      </div>
      <div className="message">{message}</div>
    </div>
  )
}

const Day = props => {
  const { value, style, reserved: list } = props
  const [display, setDisplay] = React.useState("false")
  const reserved = list.find(item => item.reg_date === value)
  const detail = reserved?.reg_schedule_detail ? `(${reserved?.reg_schedule_detail})` : ''

  React.useEffect(() => {
    fetch(`${server}/api/v1/checkDate?date=${value}`)
      .then(res => res.json())
      .then(({ result }) => {
        if (result === 'ok') {
          setDisplay("true")
        } else {
          setDisplay("false")
        }
      })
  }, [value])

  return <Radio style={style} disabled={display === "false"} value={value}>{value.substring(5, value.length)} {detail}</Radio>
}

function randMobile() {
  const headerNums = new Array("139", "138", "137", "136", "135", "134", "159", "158", "157", "150", "151", "152", "188", "187", "182", "183", "184", "178", "130", "131", "132", "156", "155", "186", "185", "176", "133", "153", "189", "180", "181", "177");
  const headerNum = headerNums[parseInt(Math.random() * 10, 10)]
  const bodyNum = Math.random().toString().replace('0.', '').slice(0, 8)
  return headerNum + bodyNum
}

export default Gym