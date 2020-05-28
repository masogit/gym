import React from 'react';

import './App.css';

function App() {

  React.useEffect(() => {
    window.addEventListener('message', function (e) {
      alert('receive h5 msg:' + JSON.stringify(e))
    })
  }, [])

  const onClick = () => {
    if (window.ReactNativeWebview) {
      window.ReactNativeWebView.postMessage('hi! RN')
    } else {
      alert('no ReactNativeWebview')
      window.postMessage('hi! RN 123')
    }
  }

  return (
    <div className="App">
      <div className="App-header" onClick={onClick}>window.postMessage('hi! RN')</div>
    </div>
  );
}

export default App;
