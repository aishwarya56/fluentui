import * as React from 'react';
import {
  DelayedRender,
  getId,
  classNamesFunction,
  getNativeProps,
  htmlElementProperties,
  css,
  initializeComponentRef,
  Customizer,
} from '../../Utilities';
import { IconButton } from '../../Button';
import { Icon } from '../../Icon';
import { IMessageBarProps, IMessageBarStyleProps, IMessageBarStyles, MessageBarType } from './MessageBar.types';

const getClassNames = classNamesFunction<IMessageBarStyleProps, IMessageBarStyles>();

export interface IMessageBarState {
  labelId?: string;
  showContent?: boolean;
  expandSingleLine?: boolean;
}

export class MessageBarBase extends React.Component<IMessageBarProps, IMessageBarState> {
  public static defaultProps: IMessageBarProps = {
    messageBarType: MessageBarType.info,
    onDismiss: undefined,
    isMultiline: true,
  };

  private ICON_MAP = {
    [MessageBarType.info]: 'Info',
    [MessageBarType.warning]: 'Info',
    [MessageBarType.error]: 'ErrorBadge',
    [MessageBarType.blocked]: 'Blocked2',
    [MessageBarType.severeWarning]: 'Warning',
    [MessageBarType.success]: 'Completed',
  };

  private _classNames: { [key in keyof IMessageBarStyles]: string };

  constructor(props: IMessageBarProps) {
    super(props);

    initializeComponentRef(this);
    this.state = {
      labelId: getId('MessageBar'),
      showContent: false,
      expandSingleLine: false,
    };
  }

  public render(): JSX.Element {
    const { isMultiline } = this.props;

    this._classNames = this._getClassNames();

    return isMultiline ? this._renderMultiLine() : this._renderSingleLine();
  }

  private _getActionsDiv(): JSX.Element | null {
    if (this.props.actions) {
      return <div className={this._classNames.actions}>{this.props.actions}</div>;
    }
    return null;
  }

  private _getDismissDiv(): JSX.Element | null {
    const { onDismiss, dismissIconProps } = this.props;
    if (onDismiss) {
      return (
        <IconButton
          disabled={false}
          className={this._classNames.dismissal}
          onClick={onDismiss}
          iconProps={dismissIconProps ? dismissIconProps : { iconName: 'Clear' }}
          ariaLabel={this.props.dismissButtonAriaLabel}
        />
      );
    }
    return null;
  }

  private _getDismissSingleLine(): JSX.Element | null {
    if (this.props.onDismiss) {
      return <div className={this._classNames.dismissSingleLine}>{this._getDismissDiv()}</div>;
    }
    return null;
  }

  private _getExpandSingleLine(): JSX.Element | null {
    if (!this.props.actions && this.props.truncated) {
      return (
        <div className={this._classNames.expandSingleLine}>
          <IconButton
            disabled={false}
            className={this._classNames.expand}
            onClick={this._onClick}
            iconProps={{ iconName: this.state.expandSingleLine ? 'DoubleChevronUp' : 'DoubleChevronDown' }}
            ariaLabel={this.props.overflowButtonAriaLabel}
            aria-expanded={this.state.expandSingleLine}
          />
        </div>
      );
    }
    return null;
  }

  private _getIconSpan(): JSX.Element {
    const { messageBarIconProps } = this.props;
    return (
      <div className={this._classNames.iconContainer} aria-hidden>
        {messageBarIconProps ? (
          <Icon {...messageBarIconProps} className={css(this._classNames.icon, messageBarIconProps.className)} />
        ) : (
          <Icon iconName={this.ICON_MAP[this.props.messageBarType!]} className={this._classNames.icon} />
        )}
      </div>
    );
  }

  private _renderMultiLine(): React.ReactElement<React.HTMLAttributes<HTMLAreaElement>> {
    return (
      <div className={this._classNames.root} {...this._getRegionProps()}>
        <div className={this._classNames.content}>
          {this._getIconSpan()}
          {this._renderInnerText()}
          {this._getDismissDiv()}
        </div>
        {this._getActionsDiv()}
      </div>
    );
  }

  private _renderSingleLine(): React.ReactElement<React.HTMLAttributes<HTMLAreaElement>> {
    return (
      <div className={this._classNames.root} {...this._getRegionProps()}>
        <div className={this._classNames.content}>
          {this._getIconSpan()}
          {this._renderInnerText()}
          {this._getExpandSingleLine()}
          {this._getActionsDiv()}
          {this._getDismissSingleLine()}
        </div>
      </div>
    );
  }

  private _renderInnerText(): JSX.Element {
    const nativeProps = getNativeProps<React.HTMLAttributes<HTMLSpanElement>>(this.props, htmlElementProperties, [
      'className',
    ]);
    const theme = this.props.theme!;

    const settings = {
      theme: {
        ...theme,
        semanticColors: {
          ...theme.semanticColors,
          link: theme.semanticColors.messageLink,
          linkHovered: theme.semanticColors.messageLinkHovered,
        },
      },
    };

    return (
      <Customizer settings={settings}>
        <div
          className={this._classNames.text}
          id={this.state.labelId}
          role="status"
          aria-live={this._getAnnouncementPriority()}
        >
          <span className={this._classNames.innerText} {...nativeProps}>
            <DelayedRender>
              <span>{this.props.children}</span>
            </DelayedRender>
          </span>
        </div>
      </Customizer>
    );
  }

  private _getRegionProps = () => {
    const hasActions = !!this._getActionsDiv() || !!this._getDismissDiv();
    const regionProps = {
      'aria-describedby': this.state.labelId,
      role: 'region',
    };

    return hasActions ? regionProps : {};
  };

  private _getClassNames(): { [key in keyof IMessageBarStyles]: string } {
    const { theme, className, messageBarType, onDismiss, actions, truncated, isMultiline } = this.props;
    const { expandSingleLine } = this.state;

    return getClassNames(this.props.styles!, {
      theme: theme!,
      messageBarType: messageBarType || MessageBarType.info,
      onDismiss: onDismiss !== undefined,
      actions: actions !== undefined,
      truncated: truncated,
      isMultiline: isMultiline,
      expandSingleLine: expandSingleLine,
      className,
    });
  }

  private _getAnnouncementPriority(): 'assertive' | 'polite' {
    switch (this.props.messageBarType) {
      case MessageBarType.blocked:
      case MessageBarType.error:
      case MessageBarType.severeWarning:
        return 'assertive';
    }
    return 'polite';
  }

  private _onClick = (ev: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    this.setState({ expandSingleLine: !this.state.expandSingleLine });
  };
}
