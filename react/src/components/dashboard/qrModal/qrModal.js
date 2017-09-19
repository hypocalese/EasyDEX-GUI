import React from 'react';
import ReactDOM from 'react-dom';
import Store from '../../../store';
import { translate } from '../../../translate/translate';
import QrReader from 'react-qr-reader'
import {
  QRModalRender,
  QRModalReaderRender
} from './qrModal.render';

class QRModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      error: null,
      errorShown: false,
    };
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleScan = this.handleScan.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  handleScan(data) {
    if (data !== null) {
      if (this.props.mode === 'scan') {
        this.props.setRecieverFromScan(data);
      }

      this.closeModal();
    }
  }

  handleError(err) {
    this.setState({
      error: err.name === 'NoVideoInputDevicesError' ? translate('DASHBOARD.QR_ERR_NO_VIDEO_DEVICE') : translate('DASHBOARD.QR_ERR_UNKNOWN'),
    });
  }

  openModal() {
    this.setState({
      modalIsOpen: true,
    });

    if (this.props.mode === 'scan') {
      ReactDOM.render(
        <QrReader
          delay={50}
          style={{
            height: 281,
            width: 500,
            transform: 'scaleX(-1)'
          }}
          onError={ this.handleError }
          onScan={ this.handleScan } />, document.getElementById('webcam'));
    }
  }

  closeModal() {
    this.setState({
      modalIsOpen: false,
      errorShown: this.state.error ? true : false,
    });
    
    ReactDOM.unmountComponentAtNode(document.getElementById('webcam'));
  }

  render() {
    if (this.props.mode === 'scan') {
      return QRModalReaderRender.call(this);
    } else {
      return QRModalRender.call(this);
    }
  }
}

export default QRModal;