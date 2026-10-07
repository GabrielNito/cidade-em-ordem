'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '../../lib/utils'

const Drawer = DrawerPrimitive.Root
const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close
const DrawerPortal = DrawerPrimitive.Portal
const DrawerTitle = DrawerPrimitive.Title
const DrawerDescription = DrawerPrimitive.Description
const DrawerHandle = DrawerPrimitive.Handle

const DrawerOverlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay ref={ref} className={cn('drawer-overlay', className)} {...props} />
  ),
)
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content ref={ref} className={cn('drawer-content', className)} {...props}>
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  ),
)
DrawerContent.displayName = DrawerPrimitive.Content.displayName

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
