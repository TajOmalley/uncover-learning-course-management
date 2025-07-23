"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react"

interface CourseCalendarProps {
  courseData: any
}

export function CourseCalendar({ courseData }: CourseCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(1)
  const totalWeeks = 16

  const getWeekContent = (week: number) => {
    return courseData.calendar?.filter((item: any) => item.week === week) || []
  }

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <CardTitle>Course Calendar</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                disabled={currentWeek === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Week {currentWeek} of {totalWeeks}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
                disabled={currentWeek === totalWeeks}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Week Navigation */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 mb-4">Weeks</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {weeks.map((week) => {
                  const hasContent = getWeekContent(week).length > 0
                  return (
                    <button
                      key={week}
                      onClick={() => setCurrentWeek(week)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentWeek === week
                          ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-200"
                          : hasContent
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Week {week}</span>
                        {hasContent && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Week Content */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Week {currentWeek} Content</h3>
                <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </div>

              <div className="space-y-4">
                {getWeekContent(currentWeek).length > 0 ? (
                  getWeekContent(currentWeek).map((item: any) => (
                    <Card key={item.id} className="border-l-4 border-l-indigo-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-2">{item.title}</h4>
                            <p className="text-sm text-slate-600">
                              This unit covers fundamental concepts and introduces key topics that will be built upon
                              throughout the course.
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-2 border-dashed border-slate-300">
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="font-medium text-slate-600 mb-2">No content for this week</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Add lesson plans, readings, assignments, or other course materials for week {currentWeek}.
                      </p>
                      <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Content
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
