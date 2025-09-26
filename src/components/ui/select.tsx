"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  error?: string
  className?: string
  disabled?: boolean
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

export function Select({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar...", 
  children, 
  error,
  className,
  disabled 
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState<string>("")
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Find selected item label
  React.useEffect(() => {
    const items = React.Children.toArray(children) as React.ReactElement<SelectItemProps>[]
    const selectedItem = items.find(item => item.props.value === value)
    setSelectedLabel(selectedItem?.props.children as string || "")
  }, [value, children])

  // Handle outside clicks
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleItemSelect = (itemValue: string, itemLabel: string) => {
    onValueChange?.(itemValue)
    setSelectedLabel(itemLabel)
    setIsOpen(false)
  }

  return (
    <div className="space-y-1">
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
              : "border-gray-700",
            className
          )}
        >
          <span className={selectedLabel ? "text-white" : "text-gray-400"}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
            <div className="max-h-60 overflow-y-auto py-1">
              {React.Children.map(children, (child) => {
                if (React.isValidElement<SelectItemProps>(child)) {
                  return React.cloneElement(child, {
                    ...child.props,
                    onClick: () => handleItemSelect(child.props.value, child.props.children as string)
                  })
                }
                return child
              })}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

export function SelectItem({ value, children, disabled, onClick }: SelectItemProps & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        disabled && "text-gray-500"
      )}
    >
      {children}
    </button>
  )
}