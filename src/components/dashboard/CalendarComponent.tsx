import { useState } from 'react';
import {
    format,
    isSameDay,
    isWithinInterval,
    startOfDay,
    endOfDay,
    startOfMonth,
    addMonths,
    subMonths,
    getDay,
    getDaysInMonth,
    isToday,
    isBefore,
    isAfter
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarComponentProps {
    onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
    selectedRange: { from: Date | undefined; to: Date | undefined };
    onClose: () => void;
    bounds: { minDate: Date; maxDate: Date } | null;
}

export function CalendarComponent({ onSelect, selectedRange, onClose, bounds }: CalendarComponentProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedRange.from || bounds?.minDate || new Date());
    const [selecting, setSelecting] = useState(!selectedRange.to && !!selectedRange.from);

    if (!bounds) return null;

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startDay = getDay(firstDayOfMonth);

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        if (isBefore(clickedDate, startOfDay(bounds.minDate)) || isAfter(clickedDate, endOfDay(bounds.maxDate))) {
            return;
        }

        if (!selecting || !selectedRange.from) {
            onSelect({ from: clickedDate, to: undefined });
            setSelecting(true);
        } else {
            if (isBefore(clickedDate, selectedRange.from)) {
                onSelect({ from: clickedDate, to: selectedRange.from });
            } else {
                onSelect({ from: selectedRange.from, to: clickedDate });
            }
            setSelecting(false);
        }
    };

    const isSelected = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (selectedRange.from && isSameDay(date, selectedRange.from)) return 'start';
        if (selectedRange.to && isSameDay(date, selectedRange.to)) return 'end';
        if (selectedRange.from && selectedRange.to && isWithinInterval(date, {
            start: startOfDay(selectedRange.from),
            end: endOfDay(selectedRange.to)
        })) return 'between';
        return false;
    };

    const isDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return isBefore(date, startOfDay(bounds.minDate)) || isAfter(date, endOfDay(bounds.maxDate));
    };

    const canGoPrevious = !isSameDay(startOfMonth(currentMonth), startOfMonth(bounds.minDate)) &&
        isAfter(startOfMonth(currentMonth), startOfMonth(bounds.minDate));

    const canGoNext = !isSameDay(startOfMonth(currentMonth), startOfMonth(bounds.maxDate)) &&
        isBefore(startOfMonth(currentMonth), startOfMonth(bounds.maxDate));

    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
        <div className="p-3 w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    disabled={!canGoPrevious}
                    className={`p-1 rounded transition-colors ${canGoPrevious ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'}`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </span>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    disabled={!canGoNext}
                    className={`p-1 rounded transition-colors ${canGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'}`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const selectionType = isSelected(day);
                    const disabled = isDisabled(day);
                    const isTodayDate = isToday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

                    return (
                        <button
                            key={day}
                            onClick={() => !disabled && handleDateClick(day)}
                            disabled={disabled}
                            className={`
                h-8 w-8 rounded-full text-xs font-medium transition-all relative
                ${selectionType === 'start' || selectionType === 'end'
                                    ? 'bg-indigo-600 text-white'
                                    : selectionType === 'between'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : disabled
                                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }
                ${isTodayDate && !selectionType ? 'ring-1 ring-indigo-500' : ''}
              `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 mb-3 text-center">
                    Disponible: {format(bounds.minDate, 'dd/MM/yyyy')} - {format(bounds.maxDate, 'dd/MM/yyyy')}
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedRange.from && (
                            <span>
                                {format(selectedRange.from, 'dd/MM')}
                                {selectedRange.to && ` - ${format(selectedRange.to, 'dd/MM')}`}
                                {!selectedRange.to && ' (inicio)'}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => onSelect({ from: bounds.minDate, to: bounds.maxDate })}
                        >
                            Todo
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                            onClick={onClose}
                            disabled={!selectedRange.from || !selectedRange.to}
                        >
                            Aplicar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
