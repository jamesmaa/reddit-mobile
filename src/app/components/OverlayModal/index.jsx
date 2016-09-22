import React from 'react';
import './styles.less';

const T = React.PropTypes;

const OverlayModal = props => {
  return (
    <section className='OverlayModal'>
      <div className='OverlayModal__body'>
        <button
          type='button'
          className='OverlayModal__close'
          onClick={ props.close }
        >
          &times;
        </button>
        <div className='OverlayModal__content'>
          { props.children }
        </div>
      </div>
      <div className='OverlayModal__backdrop' />
    </section>
  );
};

OverlayModal.propTypes = {
  close: T.func.isRequired,
};

export default OverlayModal;
