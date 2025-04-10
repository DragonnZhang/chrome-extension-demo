import { Button, type ButtonProps } from 'antd';
import { createStyles } from 'antd-style';
import clsx from 'clsx';

const useStyle = createStyles(({ prefixCls, css }) => ({
  linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: linear-gradient(135deg, #6253e1, #04befe);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}));

const MagicButton: React.FC<
  ButtonProps & {
    children: React.ReactNode;
    className?: string;
  }
> = ({ children, className, ...props }) => {
  const { styles } = useStyle();

  return (
    <Button className={clsx(styles.linearGradientButton, className)} {...props}>
      {children}
    </Button>
  );
};

export default MagicButton;
