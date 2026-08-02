import React, { useState, useRef } from "react"

type IconType = "pdf" | "file" | "folder" | "trash" | "text"

interface FileIconProps {
    id: number | string
    name: string
    icon: IconType
    initialX: number
    initialY: number
    onPositionChange: (x: number, y: number) => void
    onDoubleClick: () => void
    onSingleClick?: () => void
    desktopRef: React.RefObject<HTMLDivElement | null>
    size?: number
}

const iconMap: Record<IconType, string> = {
    pdf: "/assets/pdfIcon.png",
    file: "/assets/fileIcon.png",
    folder: "/assets/fileIcon.png",
    trash: "/assets/fileIcon.png",
    text: "/assets/fileIcon.png",
}

const FileIcon: React.FC<FileIconProps> = ({
    id,
    name,
    icon,
    initialX,
    initialY,
    onPositionChange,
    onDoubleClick,
    onSingleClick,
    desktopRef,
    size = 64,
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY })
    const isDragging = useRef(false)
    const offset = useRef({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return

        const desktop = desktopRef.current
        if (!desktop) return

        const rect = desktop.getBoundingClientRect()

        let newX = e.clientX - offset.current.x
        let newY = e.clientY - offset.current.y

        // Keep inside desktop
        newX = Math.max(0, Math.min(newX, rect.width - size))
        newY = Math.max(0, Math.min(newY, rect.height - size))

        setPosition({ x: newX, y: newY })
        onPositionChange(newX, newY)
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    React.useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    })

    const handleClick = (e: React.MouseEvent) => {
        // If it's a trash icon and single click handler is provided
        if (icon === 'trash' && onSingleClick) {
            onSingleClick()
        }
    }

    return (
        <div
            className="absolute flex flex-col items-center cursor-pointer select-none"
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDoubleClick={onDoubleClick}
        >
            <img
                src={iconMap[icon]}
                alt={icon}
                width={size}
                height={size}
                draggable={false}
                className="object-contain pointer-events-none"
            />

            <span className="mt-2 text-white text-sm text-center w-20 break-words">
                {name}
            </span>
        </div>
    )
}

export default FileIcon