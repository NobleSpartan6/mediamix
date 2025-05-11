import * as React from 'react'
import * as RadixSlider from '@radix-ui/react-slider'

type BaseProps = React.ComponentPropsWithoutRef<typeof RadixSlider.Root>
interface SliderProps extends BaseProps {
  className?: string
}

/**
 * Slider component following shadcn/ui API surface. Uses Radix primitives and Tailwind styling.
 * Accepts standard Radix Slider props plus `className` for additional tailwind utilities.
 */
export const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  ({ className = '', ...props }, ref) => (
    <RadixSlider.Root
      ref={ref}
      className={`relative flex items-center select-none touch-none w-full h-5 ${className}`}
      {...props}
    >
      <RadixSlider.Track className="bg-gray-700 relative grow rounded-full h-1">
        <RadixSlider.Range className="absolute bg-accent rounded-full h-full" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="block w-3 h-3 bg-white shadow rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
    </RadixSlider.Root>
  ),
)

Slider.displayName = 'Slider' 