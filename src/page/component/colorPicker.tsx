import React from 'react';
import reactCSS from 'reactcss';
import { GithubPicker, ColorResult } from 'react-color';

type IProps = {
  color: string;
  onChange: (color: string) => void;
};
type IState = {
  displayColorPicker: boolean;
};

class SketchColorPicker extends React.Component<IProps, IState> {
  state = {
    displayColorPicker: false
  };

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  handleChange = (color: ColorResult) => {
    this.props.onChange(color.hex);
  };

  render() {
    const styles = reactCSS({
      default: {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: this.props.color
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer'
        },
        popover: {
          position: 'absolute',
          zIndex: '2'
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px'
        }
      }
    });

    return (
      <div>
        <div style={styles.swatch} onClick={this.handleClick}>
          <div style={styles.color} />
        </div>
        {this.state.displayColorPicker ? (
          <div style={styles.popover as React.CSSProperties}>
            <div
              style={styles.cover as React.CSSProperties}
              onClick={this.handleClose}
            />
            <GithubPicker
              color={this.props.color}
              onChange={this.handleChange}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default SketchColorPicker;
