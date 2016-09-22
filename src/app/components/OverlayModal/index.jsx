import React from 'react';
import './styles.less';

const T = React.PropTypes;

const OverlayModal = props => {
  return (
    <section className='OverlayModal'>
      <button
        type='button'
        className='OverlayModal__close'
        onClick={ props.close }
      >
        &times;
      </button>
      <div className='OverlayModal__body'>
        { props.children }
      </div>
      <div className='OverlayModal__backdrop' />
    </section>
  );
};

OverlayModal.propTypes = {
  close: T.func.isRequired,
};

export default OverlayModal;
